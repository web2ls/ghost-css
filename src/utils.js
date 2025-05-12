export const getFilePathWithoutFilename = (filePath) => {
  const path = filePath.split("/");
  return path.slice(0, path.length - 1).join("/");
};
