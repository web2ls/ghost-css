import { read, walk } from "files";
import { getFilePathWithoutFilename } from "./utils.js";

const args = process.argv.slice(2);

if (args.length === 0 || args.length > 1) {
  console.log("Please provide a path to the directory you want to scan.");
  process.exit(1);
}

const userPath = args[0];

const t0 = performance.now();
const filesPaths = await walk(userPath)
.filter(/[.tsx | .pcss]$/)
.filter((file) => !/node_modules/.test(file) && !/dist/.test(file) && !/build/.test(file) && !/coverage/.test(file) && !/.git/.test(file) && !/.js$/.test(file) && !/.ts$/.test(file));

const pathStore = new Map();
for (const filePath of filesPaths) {
  const pathWithoutFilename = getFilePathWithoutFilename(filePath);

  if (pathStore.has(pathWithoutFilename)) {
    // FIXME: this case is not working
    // because the file name is not the same as expected
    const existsValue = pathStore.get(pathWithoutFilename)[0];
    const existsValueNameWithExt = existsValue.split("/").pop();
    const existsValueName = existsValueNameWithExt.split(".")[0];

    const newValueNameWithExt = filePath.split("/").pop();
    const newValueName = newValueNameWithExt.split(".")[0];

    if (existsValueName === newValueName) {
      pathStore.set(pathWithoutFilename, [existsValue, filePath]);
    }
  } else {
    pathStore.set(pathWithoutFilename, [filePath]);
  }
}

pathStore.forEach((value, key) => {
  if (value.length !== 2) {
    pathStore.delete(key);
  }
})

for (const [key, value] of pathStore) {
  const cssFilePath = value.find((path) => path.endsWith(".pcss"));
  const tsxFilePath = value.find((path) => path.endsWith(".tsx"));

  if (!cssFilePath || !tsxFilePath) {
    continue;
  }

  const cssFile = await read(cssFilePath);
  if (!cssFile) {
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

  const formattedPath = getFilePathWithoutFilename(cssFilePath)

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

const t1 = performance.now();
console.log("Execution time: " + (t1 - t0) + " milliseconds.");
