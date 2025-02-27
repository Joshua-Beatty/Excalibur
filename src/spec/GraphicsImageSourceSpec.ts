import * as ex from '@excalibur';

describe('A ImageSource', () => {
  it('exists', () => {
    expect(ex.ImageSource).toBeDefined();
  });

  it('can be constructed', () => {
    const spriteFontImage = new ex.ImageSource('src/spec/images/GraphicsTextSpec/spritefont.png');
    expect(spriteFontImage).toBeDefined();
  });

  it('logs a warning on image type not supported', () => {
    const logger = ex.Logger.getInstance();
    spyOn(logger, 'warn');
    const image1 = new ex.ImageSource('base/404/img.svg');
    expect(logger.warn).toHaveBeenCalledTimes(1);
    const image2 = new ex.ImageSource('base/404/img.gif');
    expect(logger.warn).toHaveBeenCalledTimes(2);
  });

  it('can load images', async () => {
    const spriteFontImage = new ex.ImageSource('src/spec/images/GraphicsTextSpec/spritefont.png');
    const whenLoaded = jasmine.createSpy('whenLoaded');
    const image = await spriteFontImage.load();
    await spriteFontImage.ready.then(whenLoaded);

    expect(image.src).not.toBeNull();
    expect(whenLoaded).toHaveBeenCalledTimes(1);
  });

  it('will log a warning if images are too large for mobile', async () => {
    const canvasElement = document.createElement('canvas');
    canvasElement.width = 100;
    canvasElement.height = 100;
    const webgl = new ex.ExcaliburGraphicsContextWebGL({
      canvasElement: canvasElement,
      enableTransparency: false,
      backgroundColor: ex.Color.White
    });
    const logger = ex.Logger.getInstance();
    spyOn(logger, 'warn');
    spyOn(logger, 'error');

    const sut = new ex.ImageSource('src/spec/images/GraphicsImageSourceSpec/big-image.png');

    await sut.load();

    expect(logger.warn).toHaveBeenCalledWith( `The image [src/spec/images/GraphicsImageSourceSpec/big-image.png] provided to excalibur` +
    ` is too large may not work on all mobile devices, it is recommended you resize images to a maximum (4096x4096).\n\n` +
    `Images will likely render as black rectangles on some mobile platforms.\n\n` +
    `Read more here: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices#understand_system_limits`);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('will log an error if images are too large for the current platform', async () => {
    const canvasElement = document.createElement('canvas');
    canvasElement.width = 100;
    canvasElement.height = 100;
    const webgl = new ex.ExcaliburGraphicsContextWebGL({
      canvasElement: canvasElement,
      enableTransparency: false,
      backgroundColor: ex.Color.White
    });
    const logger = ex.Logger.getInstance();
    spyOn(logger, 'warn');
    spyOn(logger, 'error');

    (ex.TextureLoader as any)._MAX_TEXTURE_SIZE = 4096;

    const sut = new ex.ImageSource('src/spec/images/GraphicsImageSourceSpec/big-image.png');

    await sut.load();

    expect(logger.warn).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      `The image [src/spec/images/GraphicsImageSourceSpec/big-image.png] provided to Excalibur is too large for the device's maximum ` +
      `texture size of (4096x4096) please resize to an image for excalibur to render properly.\n\n` +
      `Images will likely render as black rectangles.\n\n` +
      `Read more here: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices#understand_system_limits`);
  });

  it('can load images with an image filtering Blended', async () => {
    spyOn(ex.TextureLoader, 'load').and.callThrough();
    const spriteFontImage = new ex.ImageSource('src/spec/images/GraphicsTextSpec/spritefont.png', false, ex.ImageFiltering.Blended);
    const whenLoaded = jasmine.createSpy('whenLoaded');
    const image = await spriteFontImage.load();
    await spriteFontImage.ready.then(whenLoaded);

    expect(image.src).not.toBeNull();
    expect(whenLoaded).toHaveBeenCalledTimes(1);
    expect(ex.TextureLoader.load).toHaveBeenCalledWith(image, ex.ImageFiltering.Blended);
  });

  it('can load images with an image filtering Pixel', async () => {
    spyOn(ex.TextureLoader, 'load').and.callThrough();
    const spriteFontImage = new ex.ImageSource('src/spec/images/GraphicsTextSpec/spritefont.png', false, ex.ImageFiltering.Pixel);
    const whenLoaded = jasmine.createSpy('whenLoaded');
    const image = await spriteFontImage.load();
    await spriteFontImage.ready.then(whenLoaded);

    expect(image.src).not.toBeNull();
    expect(whenLoaded).toHaveBeenCalledTimes(1);
    expect(ex.TextureLoader.load).toHaveBeenCalledWith(image, ex.ImageFiltering.Pixel);
  });

  it('can convert to a Sprite', async () => {
    const spriteFontImage = new ex.ImageSource('src/spec/images/GraphicsTextSpec/spritefont.png');
    const sprite = spriteFontImage.toSprite();

    // Sprites have no width/height until the underlying image is loaded
    expect(sprite.width).toBe(0);
    expect(sprite.height).toBe(0);

    const image = await spriteFontImage.load();
    await spriteFontImage.ready;
    expect(sprite.width).toBe(image.width);
    expect(sprite.height).toBe(image.height);
  });

  it('can unload from memory', async () => {
    const spriteFontImage = new ex.ImageSource('src/spec/images/GraphicsTextSpec/spritefont.png');
    await spriteFontImage.load();
    expect(spriteFontImage.image.src).not.toBeNull();
    spriteFontImage.unload();
    expect(spriteFontImage.image.src).toBe('');
  });

  it('can load from a legacy texture', async () => {
    const tex = new ex.LegacyDrawing.Texture('src/spec/images/GraphicsTextSpec/spritefont.png');
    await tex.load();
    const img = ex.ImageSource.fromLegacyTexture(tex);
    expect(img.width).not.toBe(0);
    expect(img.height).not.toBe(0);
  });

  it('can load from an unloaded legacy texture', async () => {
    const tex = new ex.LegacyDrawing.Texture('src/spec/images/GraphicsTextSpec/spritefont.png');
    const img = ex.ImageSource.fromLegacyTexture(tex);
    await tex.load();
    expect(img.width).not.toBe(0);
    expect(img.height).not.toBe(0);
  });

  it('will resolve the image if alreadly loaded', async () => {
    const spriteFontImage = new ex.ImageSource('src/spec/images/GraphicsTextSpec/spritefont.png');
    const image = await spriteFontImage.load();

    expect(spriteFontImage.isLoaded()).toBe(true);
    const alreadyLoadedImage = await spriteFontImage.load();

    expect(image).toBe(alreadyLoadedImage);
  });

  it('will load base64 strings', async () => {
    const base64Image = new ex.ImageSource(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg=='
    );
    await base64Image.load();

    expect(base64Image.isLoaded()).toBe(true);
    expect(base64Image.image.src).toBe(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg=='
    );
  });

  it('will return error if image doesn\'t exist', async () => {
    const spriteFontImage = new ex.ImageSource('42.png');

    await expectAsync(spriteFontImage.load()).toBeRejectedWith(
      'Error loading ImageSource from path \'42.png\' with error [Not Found]'
    );
  });
});
