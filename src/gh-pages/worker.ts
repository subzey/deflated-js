/// <reference lib="webworker"/>

import { inflateRaw } from 'pako';
import { FetchCrunchBase } from '../../package/base.js';
import { WasmZopfliBase } from '../../package/wasm-zopfli-base';
import wasmUrl from '../../package/zopfli-with-dictionary.wasm';

class WasmZopfliBrowser extends WasmZopfliBase {
	protected async _loadWasmBinary(): Promise<Uint8Array> {
		const response = await fetch(wasmUrl);
		if (!response.ok) {
			throw new Error(`Not OK: ${response.status}`);
		}
		return new Uint8Array(await response.arrayBuffer());
	}
}

let singletonDeflater: WasmZopfliBrowser | null = null;

class FetchCrunchBrowser extends FetchCrunchBase {
	private _iterations: number | undefined;
	private _template: string | undefined;

	public constructor(params: { iterations?: number; template?: string}) {
		super();
		this._iterations = params.iterations;
		this._template = params.template;
	}
	protected _htmlTemplate(): string {
		return this._template || super._htmlTemplate();
	}
	protected _binaryFromDeflateRaw(compressed: Uint8Array): Uint8Array {
		return inflateRaw(compressed);
	}
	protected _deflateRawFromBinary(source: Uint8Array, dictionary: Uint8Array): Promise<Uint8Array> {
		singletonDeflater ??= new WasmZopfliBrowser();
		return singletonDeflater.deflateRaw(source, { dictionary, numIterations: this._iterations });
	}
}

self.addEventListener('message', async (e: MessageEvent) => {
	try {
		const fetchCrunch = new FetchCrunchBrowser(e.data);
		const result = await fetchCrunch.crunch(e.data.source);
		self.postMessage({ result }, [ result.buffer ]);
	} catch (e) {
		self.postMessage({ errorMessage: (e as Error | null)?.message });
	}
});

