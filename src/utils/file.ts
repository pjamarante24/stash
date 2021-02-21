import { promises as fs, Stats } from "fs";

export type FileOptions = {
  verbose: boolean;
};

const defaultOptions: FileOptions = {
  verbose: false,
};

export async function exists(path: string): Promise<Stats | null> {
  return fs.stat(path).catch(() => null);
}

export const write = async (path: string, content: string): Promise<void> => {
  return fs.writeFile(path, content);
};

export const mkdir = async (
  path: string,
  options: FileOptions = defaultOptions
): Promise<void> => {
  return fs
    .mkdir(path, { recursive: true })
    .then((value) => {
      if (options.verbose) console.log(`File created ${value}`);
    })
    .catch((error) => {
      if (options.verbose) console.log("Cannot create file", error);
    });
};

export const readdir = async (
  path: string,
  options: FileOptions = defaultOptions
): Promise<Array<string>> => {
  return fs.readdir(path).catch((error) => {
    if (options.verbose) console.log(`Cannot read directory ${path}`, error);
    return [];
  });
};

export const read = async (path: string): Promise<string> => {
  return fs.readFile(path, "utf8");
};

export async function remove(
  path: string,
  options: FileOptions = defaultOptions
): Promise<boolean> {
  return fs
    .rmdir(path, { recursive: true })
    .catch(() => fs.rm(path, { recursive: true }))
    .then(() => {
      if (options.verbose) console.log(`File removed ${path}`);
      return true;
    })
    .catch((error) => {
      if (options.verbose) console.log(`Cannot remove file ${path}`, error);
      return false;
    });
}

export default { exists, write, mkdir, readdir, read, remove };
