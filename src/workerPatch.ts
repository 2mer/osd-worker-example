import { TileSource } from "openseadragon";
import ImageWorker from "./ImageWorker";
import { v4 } from "uuid";

export default function workerPatch(tileSource: TileSource): TileSource {

	return Object.assign(tileSource, {

		downloadTileStart: function (context) {
			let canvas = document.createElement("canvas");

			const event = { id: v4(), url: context.src };

			function handleMessage(e) {

				const { id, imageBitmap } = e.data;

				if (id === event.id) {

					canvas.width = imageBitmap.width;
					canvas.height = imageBitmap.height;

					const ctx = canvas.getContext('bitmaprenderer');
					ctx!.transferFromImageBitmap(imageBitmap);

					context.finish(ctx);

					ImageWorker.removeEventListener('message', handleMessage);
				}

			}

			ImageWorker.addEventListener('message', handleMessage);

			ImageWorker.postMessage(event);

		},

		downloadTileAbort: function (_context) {
			//we could set a flag which would stop the execution,
			// and it would be right to do so, but it's not necessary
			// (could help in debug scenarios though, in case of cycling
			// it could kill it)

			//pass
		},

		createTileCache: function (cache, data) {
			//cache is the cache object meant to attach items to
			//data is context2D, just keep the reference
			cache._data = data;
		},

		destroyTileCache: function (cache) {
			//unset to allow GC collection
			cache._data = null;
		},

		getTileCacheData: function (cache) {
			//just return the raw data as it was given, part of API
			return cache._data;
		},

		getTileCacheDataAsImage: function () {
			// not implementing all the features brings limitations to the
			// system, namely tile.getImage() will not work and also
			// html-based drawing approach will not work
			throw "Lazy to implement";
		},

		getTileCacheDataAsContext2D: function (cache) {
			// our data is already context2D - what a luck!
			return cache._data;
		}
	})
}