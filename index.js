import { read, walk } from "files";

const getFilePath = (filePath) => {
  const path = filePath.split("/");
  return path.slice(0, path.length - 1).join("/");
};

const readmes = await walk("./")
.filter(/[.tsx | .pcss]$/);
const store = new Map();
for (const filePath of readmes) {
  const formattedPath = getFilePath(filePath);
  console.log(formattedPath);

  if (store.has(formattedPath)) {
    const existsValue = store.get(formattedPath)[0];
    const existsValueNameWithExt = existsValue.split("/").pop();
    const existsValueName = existsValueNameWithExt.split(".")[0];

    const newValueNameWithExt = filePath.split("/").pop();
    const newValueName = newValueNameWithExt.split(".")[0];

    if (existsValueName === newValueName) {
      store.set(formattedPath, [existsValue, filePath]);
    }
  } else {
    store.set(formattedPath, [filePath]);
  }
}

store.forEach((value, key) => {
  if (value.length !== 2) {
    store.delete(key);
  }
})

console.log(store);

for (const [key, value] of store) {
  const cssFilePath = value.find((path) => path.endsWith(".pcss"));
  const tsxFilePath = value.find((path) => path.endsWith(".tsx"));

  if (!cssFilePath || !tsxFilePath) {
    continue;
  }

  const cssFile = await read(cssFilePath);
  if (!cssFile) {
    console.log("css file not found", cssFilePath);
    throw new Error("css file not found on path: " + key);
  }

  const cssClasses = [...cssFile.matchAll(/\.(.*?)\s/g)]
  .map((match) => {
    let item = match[0];
    item = item.replace(/^\.|\s$/g, "");
    return item;
  });

  const uniqueCssClasses = [...new Set(cssClasses)];

  const ghostClasses = new Map();

  const tsxFile = await read(tsxFilePath);

  const formattedPath = getFilePath(cssFilePath)

  uniqueCssClasses.forEach((cssClass) => {
    if (!tsxFile.includes(`styles.${cssClass}`) && !tsxFile.includes(`s.${cssClass}`)) {
      if (ghostClasses.has(formattedPath)) {
        ghostClasses.get(formattedPath).push(cssClass);
      } else {
        ghostClasses.set(formattedPath, [cssClass]);
      }
    }
  })

  console.log("ghost classes", ghostClasses);
}
