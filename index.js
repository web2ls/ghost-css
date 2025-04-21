import { read, walk } from "files";

const results = [];

const readmes = await walk("test")
console.log(readmes);