import { TileSource } from "openseadragon";
import MandlebrotWorker from "./MandlebrotImageWorker";
import { v4 } from "uuid";

export default {
	//please, do not use Infinity, OSD internally builds a cached tile hierarchy
	height: 1024 * 1024 * 1024,
	width: 1024 * 1024 * 1024,
	tileSize: 256,
	minLevel: 9,
	//fractal parameter
	// maxIterations: 100,
	getTileUrl: function (level, x, y) {
		//note that we still have to implement getTileUrl
		//since we do, we use this to construct meaningful tile cache key
		//fractal has different data for different tiles - just distinguish
		//between all tiles
		return `${level}/${x}-${y}`;
	},

	getTilePostData: function (level, x, y) {
		//yup, handy post data
		return {
			dx: x,
			dy: y,
			level: level
		};
	},

	downloadTileStart: function (this: TileSource, context) {
		let size = this.getTileBounds(context.postData.level, context.postData.dx, context.postData.dy, true);
		let bounds = this.getTileBounds(context.postData.level, context.postData.dx, context.postData.dy, false);
		let canvas = document.createElement("canvas");
		// let ctx = canvas.getContext('2d');

		size.width = Math.floor(size.width);
		size.height = Math.floor(size.height);

		if (size.width < 1 || size.height < 1) {
			let ctx = canvas.getContext('2d');
			canvas.width = 1;
			canvas.height = 1;
			context.finish(ctx);
			return;
		} else {
			canvas.width = size.width;
			canvas.height = size.height;
		}

		//don't really think about the rescaling, just played with
		// linear transforms until it was centered
		bounds.x = bounds.x * 2.5 - 1.5;
		bounds.width = bounds.width * 2.5;
		bounds.y = (bounds.y * 2.5) - 1.2;
		bounds.height = bounds.height * 2.5;


		/// ------ start worker code

		const event = { bounds, size, id: v4() };

		function handleMessage(e) {

			const { id, imageBitmap } = e.data;

			if (id === event.id) {
				const ctx = canvas.getContext('bitmaprenderer');
				ctx!.transferFromImageBitmap(imageBitmap);

				context.finish(ctx);

				MandlebrotWorker.removeEventListener('message', handleMessage);
			}

		}

		MandlebrotWorker.addEventListener('message', handleMessage);

		MandlebrotWorker.postMessage(event);

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
}