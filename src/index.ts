import path from "path";
import file, { FileOptions } from "./utils/file";

type CacheManagerOptions = {
  namespace: string;
  ttl: number;
  checkPeriod: number;
  path: string;
  onlyFileSystem: boolean;
  verbose: boolean;
};

const defaultOptions: CacheManagerOptions = {
  namespace: "default",
  ttl: 0,
  checkPeriod: 600,
  path: path.resolve(__dirname, ".cache"),
  onlyFileSystem: false,
  verbose: false,
};

class Stash {
  options: CacheManagerOptions;
  persited: Map<string, any>;
  watcher: CacheWatcher;
  nsPath: string;
  fileOptions: FileOptions;

  constructor(options: CacheManagerOptions = defaultOptions) {
    this.options = options;
    this.options.namespace = this.options.namespace || defaultOptions.namespace;
    this.options.checkPeriod =
      this.options.checkPeriod || defaultOptions.checkPeriod;
    this.options.ttl = this.options.ttl || defaultOptions.ttl;
    this.options.path = this.options.path || defaultOptions.path;
    this.options.onlyFileSystem =
      this.options.onlyFileSystem || defaultOptions.onlyFileSystem;
    this.options.verbose = this.options.verbose || defaultOptions.verbose;
    this.persited = new Map<string, any>();
    this.nsPath = path.join(this.options.path, this.options.namespace);
    this.fileOptions = { verbose: this.options.verbose };

    this.watcher = new CacheWatcher(options);
    this.watcher.start();
    this.watcher.on(CacheWatcherEvents.check, this.check);

    this.sync();
  }

  get = (key: string): Promise<any> => {
    if (!this.options.onlyFileSystem) {
      return JSON.parse(this.persited.get(key)).value;
    } else {
      const _path = path.join(this.nsPath, key);
      return file
        .read(_path)
        .then(JSON.parse)
        .then(({ value }) => value)
        .catch((error) => {
          if (this.options.verbose) console.log(`Cannot get ${key}`, error);
          return null;
        });
    }
  };

  set = async (key: string, value: any): Promise<void> => {
    const content = JSON.stringify({
      value,
      date: new Date().getTime(),
    });

    if (!this.options.onlyFileSystem) {
      this.persited.set(key, content);
    } else {
      const _path = path.join(this.nsPath, key);
      await file.write(_path, content).catch((error) => {
        if (this.options.verbose)
          console.log("Cannot write cache into file system", error);

        if (error.code === "ENOENT") this.sync();
      });
    }
  };

  check = async (): Promise<void> => {
    const keysToDelete: Array<string> = [];
    const now = new Date().getTime();

    if (!this.options.onlyFileSystem) {
      this.persited.forEach((v, key) => {
        const value = JSON.parse(v);
        const isExpired = now >= value.date + this.options.ttl * 1000;
        if (isExpired) keysToDelete.push(key);
      });
    } else {
      const files = await file.readdir(this.nsPath, this.fileOptions);
      try {
        for (const fileName of files) {
          const _path = path.join(this.nsPath, fileName);
          const _content = await file.read(_path);
          const content = JSON.parse(_content);
          const isExpired = now >= content.date + this.options.ttl * 1000;
          if (isExpired) keysToDelete.push(fileName);
        }
      } catch (error) {
        if (this.options.verbose)
          console.log("Cannot verify cache files", error);
      }
    }

    keysToDelete.forEach((key) => this.delete(key));
  };

  delete = async (key: string): Promise<boolean> => {
    if (!this.options.onlyFileSystem) {
      return this.persited.delete(key);
    } else {
      const _path = path.join(this.nsPath, key);
      return file.remove(_path, this.fileOptions);
    }
  };

  has = async (key: string): Promise<boolean> => {
    if (!this.options.onlyFileSystem) {
      return this.persited.has(key);
    } else {
      const _path = path.join(this.nsPath, key);
      return file.exists(_path).then(Boolean);
    }
  };

  sync = async (): Promise<void> => {
    const rootPath = await file.exists(this.options.path);
    if (!rootPath) {
      await file.mkdir(this.options.path, this.fileOptions);
    }

    const nsPath = await file.exists(this.nsPath);
    if (this.options.onlyFileSystem) {
      if (!nsPath) await file.mkdir(this.nsPath, this.fileOptions);
      if (nsPath && !nsPath.isDirectory()) {
        await file.remove(this.nsPath, this.fileOptions);
        await file.mkdir(this.nsPath, this.fileOptions);
      }
    } else {
      if (nsPath && !nsPath.isDirectory()) {
        try {
          const data = await file.read(this.nsPath);
          const content = JSON.parse(data);
          Object.entries(content).forEach(([key, value]) =>
            this.persited.set(key, value)
          );
        } catch (error) {
          await file.remove(this.nsPath, this.fileOptions);
          if (this.options.verbose)
            console.log(
              "Cannot sync file system cache with memory cache",
              error
            );
        }
      } else if (nsPath && nsPath.isDirectory()) {
        await file.remove(this.nsPath, this.fileOptions);
      }
    }
  };

  save = async (): Promise<void> => {
    if (this.options.onlyFileSystem) return;
    const content: any = {};
    this.persited.forEach((value, key) => {
      content[key] = value;
    });

    await file.write(this.nsPath, JSON.stringify(content));
  };
}

type CacheWatcherOptions = {
  checkPeriod: number;
};

type CacheWatcherEvent = {
  [event in CacheWatcherEvents]: Array<Function>;
};

enum CacheWatcherEvents {
  check = "check",
}

class CacheWatcher {
  options: CacheWatcherOptions;
  events: CacheWatcherEvent;

  constructor(options: CacheWatcherOptions) {
    this.options = options;
    this.events = {
      check: [],
    };
  }

  start = (): void => {
    setInterval(this.check, this.options.checkPeriod * 1000);
  };

  check = () => {
    this.events.check.forEach((event) => event());
  };

  on = (event: CacheWatcherEvents, callback: Function) => {
    this.events[event].push(callback);
  };
}

export { Stash };

export default Stash;
