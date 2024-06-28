import { TileSource } from "openseadragon";

export default {
	//please, do not use Infinity, OSD internally builds a cached tile hierarchy
	height: 1024 * 1024 * 1024,
	width: 1024 * 1024 * 1024,
	tileSize: 256,
	minLevel: 9,
	//fractal parameter
	maxIterations: 100,
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
	iterateMandelbrot: function (refPoint) {
		var squareAndAddPoint = function (z, point) {
			let a = Math.pow(z.a, 2) - Math.pow(z.b, 2) + point.a;
			let b = 2 * z.a * z.b + point.b;
			z.a = a;
			z.b = b;
		};

		var length = function (z) {
			return Math.sqrt(Math.pow(z.a, 2) + Math.pow(z.b, 2));
		};

		let z = { a: 0, b: 0 };
		for (let i = 0; i < this.maxIterations; i++) {
			squareAndAddPoint(z, refPoint);
			if (length(z) > 2) return i / this.maxIterations;
		}
		return 1.0;
	},
	downloadTileStart: function (this: TileSource, context) {
		let size = this.getTileBounds(context.postData.level, context.postData.dx, context.postData.dy, true);
		let bounds = this.getTileBounds(context.postData.level, context.postData.dx, context.postData.dy, false);
		let canvas = document.createElement("canvas");
		let ctx = canvas.getContext('2d')!;

		size.width = Math.floor(size.width);
		size.height = Math.floor(size.height);

		if (size.width < 1 || size.height < 1) {
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

		var imagedata = ctx.createImageData(size.width, size.height);
		for (let x = 0; x < size.width; x++) {

			for (let y = 0; y < size.height; y++) {
				let index = (y * size.width + x) * 4;

				// @ts-ignore
				imagedata.data[index] = Math.floor(this.iterateMandelbrot({
					a: bounds.x + bounds.width * ((x + 1) / size.width),
					b: bounds.y + bounds.height * ((y + 1) / size.height)
				}) * 255);

				imagedata.data[index + 3] = 255;
			}
		}
		ctx.putImageData(imagedata, 0, 0);
		// note: we output context2D!
		context.finish(ctx);
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