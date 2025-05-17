export const getFilePathWithoutFilename = (filePath) => {
  const list = filePath.split("/");
  return list.slice(0, list.length - 1).join("/");
};

export const getFileNameWithoutExt = (filePath) => {
  const list = filePath.split("/");
  const filenameWithExt = list[list.length - 1];
  return filenameWithExt.split(".")[0];
}

export function getTailDir(filePath) {
  const list = filePath.split("/");
  return list.slice(-2, -1)[0];
}
