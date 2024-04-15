/**
 *
 * @module
 */
export const Sprite = (root => {
  root = root ?? self;

  function assert (value, message) {
    if (!value) throw message;
  }

  class SpriteSheet {
    img = null;
    context = null;
    mappings = [];
    imgWidth = 0;
    imgHeight = 0;
    defaultWidth = 16;
    defaultHeight = 16;
    bindToContext (ctx) {
      assert (ctx?.drawImage, `Bad context; did it come from a canvas?`);
      this.context = ctx;
    }
    onload () {}
    onerror () {}
    useImage (img) {
      assert (
        img instanceof root.HTMLImageElement ||
        img instanceof root.HTMLCanvasElement ||
        img instanceof root.Image ||
        img instanceof root.ImageBitmap
        `Unsupported image type.`
      );
      assert (!this.img, `An image has already been chosen`);

      this.img = img;
      this.imgWidth = img.naturalWidth ?? img.width;
      this.imgHeight = img.naturalHeight ?? img.height;

      this.onload(img);
    }
    fetchImage (url) {
      fetch(url).then(async (response) => {
        if (!response.ok) return this.onerror();
        let file = await response.blob();
        let bitmap = await createImageBitmap(file);
        this.useImage(bitmap);
      }).catch(r => {
        this.loadImage(url);
      });
    }
    loadImage (url) {
      let img = new Image();

      img.onload = evt => this.useImage(img);
      img.onerror = evt => this.onerror();
      img.src = url;
    }
    mapGrid ({ sourceX, sourceY, sourceWidth, sourceHeight, rows, columns }) {
      for (let dy = sourceY, ddy = sourceHeight / columns; dy < sourceHeight; dy += ddy)
        for (let dx = sourceX, ddx = sourceWidth / rows; dx < sourceWidth; dx += ddx)
          this.mapImage ({ sourceX: dx, sourceY: dy, sourceWidth: ddx, sourceHeight: ddy });
    }
    mapImage ({ sourceX, sourceY, sourceWidth, sourceHeight }) {
      assert (this.img, `No image Loaded!`);
      sourceWidth = sourceWidth ?? this.defaultWidth;
      sourceHeight = sourceHeight ?? this.defaultHeight;
      assert (
        sourceX >= 0 && sourceY >= 0 &&
        sourceX + sourceWidth < this.imgWidth &&
        sourceY + sourceHeight < this.imgHeight,
        `Mapping is not within the border of the image!`
      );
      this.mappings.push ({ sourceX, sourceY, sourceWidth, sourceHeight });
    }
    paintImage (index, destX, destY, destWidth, destHeight) {
      assert (this.img, `No image loaded!`)
      assert (this.context, `Cannot draw sprite to ${this.context}`);

      let mapping = this.mappings[index];
      this.context.drawImage (
        this.img,
        mapping.sourceX, mapping.sourceY, mapping.sourceWidth, mapping.sourceHeight,
        destX, destY, destWidth, destHeight
      )
    }
  }

  return root.Sprite = {
    Sheet: SpriteSheet,
    new: async url => {
      let s = new SpriteSheet;

      await new Promise((resolve, reject) => {
        s.onload = resolve;
        s.onerror = reject;
        s.fetchImage(url);
      });

      return s;
    }
  };
})(this);