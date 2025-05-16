export const getFilePathWithoutFilename = (filePath) => {
  const list = filePath.split("/");
  return list.slice(0, list.length - 1).join("/");
};
