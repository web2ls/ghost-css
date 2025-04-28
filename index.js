import { read, walk } from "files";

const results = [];

const readmes = await walk("test")
.filter(/[.tsx | .pcss]$/);
console.log(readmes);

const file = await read(readmes[0]);
console.log(file);