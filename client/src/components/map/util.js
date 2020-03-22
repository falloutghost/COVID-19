export const getCircleData = ({ size }) => {
  const bytesPerPixel = 4;
  const data = new Uint8Array(size * size * bytesPerPixel);

  for (let x = 0; x < size; x += 1) {
    for (let y = 0; y < size; y += 1) {
      const offset = (y * size + x) * bytesPerPixel;
      data[offset + 0] = (y / size) * 255;
      data[offset + 1] = (x / size) * 255;
      data[offset + 2] = 128;
      data[offset + 3] = 255;
    }
  }

  return data;
};
