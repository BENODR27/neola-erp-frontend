const test = require('node:test');
const assert = require('node:assert/strict');
const QRCode = require('qrcode');
const { RGBLuminanceSource, BinaryBitmap, HybridBinarizer, QRCodeReader } = require('@zxing/library');

test('printed permanent machine URL survives QR encoding and scanner decoding', () => {
  const url = 'https://maintenance.example/mmms/qr-management?reference=MMMS-53ca690b-f0e5-438f-8401-307994904709';
  const code = QRCode.create(url, { errorCorrectionLevel: 'M' });
  const scale = 6; const quiet = 4; const side = (code.modules.size + quiet * 2) * scale;
  const pixels = new Uint8ClampedArray(side * side).fill(255);
  for (let y = 0; y < code.modules.size; y++) for (let x = 0; x < code.modules.size; x++) {
    if (!code.modules.get(y, x)) continue;
    for (let dy = 0; dy < scale; dy++) for (let dx = 0; dx < scale; dx++) pixels[((y + quiet) * scale + dy) * side + (x + quiet) * scale + dx] = 0;
  }
  const bitmap = new BinaryBitmap(new HybridBinarizer(new RGBLuminanceSource(pixels, side, side)));
  assert.equal(new QRCodeReader().decode(bitmap).getText(), url);
});
