/**
 * Commander.js - A small, customizable command processing engine
 *
 * @file commander.js
 * @module
 * @version 1.1.2dev
 * @author HSstudent16
 *
 */

/**
 * The Commander library;
 *
 * There are several interfaces, including
 *
 *  - `Type`, a class for creating custom data types with parsing rules
 *  - `Value`, a class that stores a value & type pair
 *  - `Engine`, the primary class that creates a new command processor
 *  - `getErrorDescription`, a function that translates an error code
 *  - `defaultTypes`, an object that stores the built-in types, including:
 *     `'number'`, `'bool'`, `'string'`, `'symbol'`, and `'variable'`
 */
export const Commander = (root => {

  // The window object
  root = root ?? self;

  /**
   * The library interface;
   *
   * @property {typeof Value} Value
   */
  let output = {};


  /**
   * A constructor that represents a value;
   * The type & actual JS value are remembered,
   * to make parsing easier.
   */
  class Value {
    /**
     * Create a new Value object
     *
     * @param {any} value Any value, preferably one that matches the type specified
     * @param {string} type The name of a defined `Type`
     */
    constructor(value, type) {
      this.type = type;
      this.value = value;
    }
  }
  output.Value = Value;


  /**
   * A constructor that defines a new data type,
   * its priority, and its parsing rules.
   */
  class Type {
    /**
     * Create a new Type instance
     *
     * @param {string} name The name of the type
     * @param {?number} priority
     *     A priority value that determines whether this type is checked before others.
     *     A priority of -1 (default) will have the type checked after previously defined
     *     types.
     */
    constructor(name, priority) {
      this.name = name;
      this.priority = priority ?? -1;
    }

    /**
     * Returns true if a character marks the beginning of a value of this type.
     *
     * @param {string} char
     *     The character in question
     * @param {object} flags
     *     An object that can (and should) be used to mark any special data that gets used
     *     later. E.G. which quote (single or double) was used to open a string?
     *
     * @returns {boolean} True iff the type matches
     */
    begin(char, flags) {
      return false;
    }

    /**
     * Returns true if a character marks the end of a value of this type.
     *
     * @param {string} char
     *     The character in question
     * @param {object} flags
     *     An object that can be used to mark special data for parsing.
     *
     * @returns {bool} True iff the type's syntax is complete
     */
    end(char, flags) {
      return true;
    }

    /**
     * Parse & return a value after its syntax is verified as complete.
     *
     * @param {string} literal A string straight from the incomming command prompt
     *
     * @returns {Value} The parsed value; this doesn't have to be of the same type as this class defines.
     */
    parse(literal) {
      return literal;
    }

  }
  output.Type = Type;


  // Some basic type definitions; these get filled out later, right now they are just reserved.
  const number = new Type('number');
  const string = new Type('string');
  const symbol = new Type('symbol');
  const variable = new Type('variable');
  const bool = new Type('bool');

  // export the types, in case you wish to modify them
  output.defaultTypes = { number, string, symbol, variable, bool };


  /**
   * Translates in error code into something human-readible.
   *
   * @param {number} code An error code from the command engine
   * @returns {string} A message describing the error that occurred.
   */
  function getErrorDescription(code) {
    switch (code) {
      case 0x0:
        return "No errors were found.";
      case 0x1:
        return "Thrown error.";
      case 0x2:
        return "Unexpected argument type.";
      case 0x3:
        return "Too many arguments provided.";
      case 0x4:
        return "Too few arguments provided.";
      case 0x5:
        return "Unknown type; perhaps you forgot a space?";
      case 0x6:
        return "Unclosed argument; make sure strings, arrays, etc. have a closing mark.";
      case 0x7:
        return "Syntax Error.";

      case 0x8:
        return "No errors were found";
      case 0x9:
        return "Unknown command; make sure you spelled it correctly.";
      case 0xA:
        return "Unknown variable; make sure you spelled it correctly and the variable is defined.";
      case 0xB:
        return "Unknown type; value could not be parsed.";
    }
  }
  output.getErrorDescription = getErrorDescription;


  /**
   * The Meat & Potatos of this library: the command engine class
   */
  class CommandEngine {

    // Some predefined values to establish a default syntax.
    static whitespace = " \t";
    static symbols = "+=-><*&^%!~*/?|";
    static quotes = "\"'";
    static numerals = ".0123456789";
    static comment = "#";
    static variable = "$";
    static var_chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_";
    static operators = [
      "=", "+", "-", "/", "*", "&", "|", "^", "%", ">", "<",
      "==", "+=", "-=", "/=", "*=", "&=", "|=", "^=", "%=", ">=", "<="
    ];

    /**
     * Create a new command engine.
     */
    constructor() {
      this.cmds = {};
      /** @type {string[]} */
      this.enumerated_cmds = [];
      /** @type {string[]} */
      this.batch = [];

      this.current_line = 0;
      this.done = true;

      this.current_cmd = "";
      /** @type {Value[]} */
      this.current_args = [];

      /**@type {Type[]} */
      this.valid_types = [];

      /** @type {Object<Value>} */
      this.env_vars = {};
      this.error_code = 0x0;

      this.whitespace = CommandEngine.whitespace;
      this.comment = CommandEngine.comment;

      // Link the default types
      this.typedef(number);
      this.typedef(bool);
      this.typedef(symbol);
      this.typedef(string);
      this.typedef(variable);

    }

    /**
     * Returns true if an environment variable is defined
     *
     * @param {string} name A variable name
     *
     * @returns {boolean}
     */
    exists (name) {
      return name.toUpperCase() in this.env_vars;
    }

    /**
     * Creates and/or updates environment varible
     *
     * @param {string} name The variable's name
     * @param {any} value A value to store
     * @param {string} type The data type
     */
    setvar (name, value, type) {
      this.env_vars[name.toUpperCase()] = new Value(value, type);
    }

    /**
     * Retrieves the value of an environment variable
     *
     * @param {string} name The variable's name
     * @returns {Value}
     */
    getvar (name) {
      return this.env_vars[name.toUpperCase()];
    }

    /**
     * Adds a `Type` instance to the command interpreter's list of valid types.
     *
     * @param {Type} type The type that is getting added
     */
    typedef(type) {
      if (type.priority < 0) {
        this.valid_types.push(type);
        return;
      }
      for (let i = 0, l = this.valid_types.length; i < l; i++) {
        let t = this.valid_types[i];

        if (t.priority > type.priority) continue;

        this.valid_types.splice(i - 1, 0, type);

        return;
      }

      this.valid_types.push(type);
    }

    /**
     * Registers a new command with a given name & callback function.  The callback
     * function SHOULD be async; I think it will work even if it isn't.
     *
     * @param {{
     *   enumerated: ?boolean,
     *   name: string,
     *   action: Function,
     *   returns: ?string,
     *   syntax: string[],
     *   description: string
     * }} config An object literal that specifies information about the command
     */
    registerCommand(config) {
      let cmd = {};

      let name = config.name.toUpperCase();

      if (config.enumerated ?? true) {
        this.enumerated_cmds.push(name);
      }

      let syntax = config.syntax.join('\0').toLowerCase().split('\0');

      cmd.name = name;
      cmd.syntax = syntax;
      cmd.action = config.action.bind(this);
      cmd.returns = config.returns ?? "any";
      cmd.description = config.description;

      this.cmds[name] = cmd;
    }

    /**
     * Reads a command & parses its arguments
     *
     * @param {string} line A line of code to run
     * @returns {number} An error code
     */
    interpret(line) {

      this.current_cmd = "";
      this.current_args = [];

      // ignore blank lines
      line = line.trim();
      if (!line || line[0] === this.comment) return 0x0;

      // Add a space to the end to make my code work.
      // I'm lazy.
      line += this.whitespace[0];

      // Remember anything important from previous characters
      let reading = '',
        this_word = '',
        this_char = '',
        this_type = null,
        this_arg,
        flags = {
          was_space: false,
          skip_char: false
        },

        // remember the command name & the arguments given.
        cmd_name = '',
        args = [];

      // Indexing
      let i = 0,
        l = line.length,
        type_idx,
        type_length = this.valid_types.length;

      // Look at each character
      for (; i < l; i++) {

        this_char = line[i];

        // Getting the command name has highest priority
        if (!cmd_name) {
          if (this.whitespace.includes(this_char)) {

            // A space after a word = command name finished!
            if (this_word) {
              cmd_name = this_word;
              flags.was_space = true;
              this_word = '';
            }
            // Don't bother writing the space
            continue;
          }

          // Comment?
          if (!this_word && this_char === this.comment) {
            return 0x0;
          }

          // If the command name is already picked, then read arguments.

          // First, continue reading for a specific type, that way strings
          // can contain spaces, JSON can contain strings, etc.
        } else if (reading) {

          // If the argument should end, then mark it so.
          // This may result in trailing space, which parsing
          // should expect.
          if (this_type.end(this_char, flags)) {
            reading = '';

            // automatically ignore a whitespace that signals then end of a value
            if (this.whitespace.includes(this_char)) {
              // Parse & validate the type
              this_arg = this_type.parse(this_word);

              this_arg.literal = this_word.trim();

              // Reset the argument stuff
              flags.was_space = false;
              this_type = null;
              this_word = '';

              // Value couldn't be parsed
              if (this_arg.type.toString() === "error") return 0x07;

              // Add the argument, and skip the whitespace.
              args.push(this_arg);

              flags.was_space = true;
              continue;
            }

            if (flags.skip_char) {
              flags.skip_char = false;
              continue;
            }
          }

          // Second, if no specific type is chosen, attempt to chose one.
        } else if (!this.whitespace.includes(this_char)) {

          // The same argument had a different type...?
          // Something's wrong o_O
          if (this_type) {
            return 0x05;
          }

          // If a type hasn't been determined, keep looking.
          for (type_idx = 0; type_idx < type_length; type_idx++) {
            this_type = this.valid_types[type_idx];
            // A match was made? Stop checking the other types (sorted by priority)
            if (this_type.begin(this_char, flags)) {
              reading = this_type.name;
              break;
            }
          }

          if (!reading) {
            return 0xB
          }
          // Whitespace, with no strings attatched!  Time to put lipstick on the pig.
        } else {
          if (flags.was_space) continue;

          // This shouldn't ever happen...
          if (!this_word) return 0xF1;

          // No type was found :(
          if (!this_type) return 0x0B;

          // Parse & validate the type
          this_arg = this_type.parse(this_word);

          this_arg.literal = this_word.trim();

          // Reset the argument stuff
          flags.was_space = false;
          this_type = null;
          this_word = '';

          // Value couldn't be parsed
          if (this_arg.type.toString() === "error") return 0x07;

          // Add the argument, and skip the whitespace.
          args.push(this_arg);

          flags.was_space = true;
          continue;
        }

        flags.was_space = false;
        this_word += this_char;
      }

      this.current_cmd = cmd_name.toUpperCase();
      this.current_args = args;

      return 0x0;
    }

    /**
     * Actually runs a command, after interpreting.
     *
     * @returns {Promise<number>} An error code (@see CommandEngine.prototype.interpret)
     */
    async execute() {
      let name = this.current_cmd;
      let args = this.current_args;
      let cmd = null;

      // This will get filled with mostly the same values as args,
      // except variables will have their stored value input.
      let mapped_args = [];

      // No command? silently ignore.
      if (!name) return 0x0;

      // Unknown command
      if (!this.enumerated_cmds.includes(name)) return 0x09;

      cmd = this.cmds[name];


      // Don't look up everything each iteration.
      let i = 0,
        syn_arg_len = cmd.syntax.length,
        cmd_arg_len = args.length,
        stop = Math.max(syn_arg_len, cmd_arg_len);

      for (; i < stop; i++) {

        // Too few arguments given.
        if (i >= syn_arg_len) return 0x03;

        let correct_type = cmd.syntax[i], this_arg;

        // Optional arguments
        if (correct_type[0] === "?") {
          correct_type = correct_type.slice(1);
          if (i >= cmd_arg_len) continue;

          // Too many arguments given.
        } else if (i >= cmd_arg_len) return 0x4;

        // variable and any are special types, and have unique behavior
        this_arg = args[i];

        // Right now, multiple types can be specified with a vertical bar.
        correct_type = correct_type.split("|");

        // Variable & any are types with unique behavior;

        // If a variable is given for a type that is not "variable,"
        // use the variable's stored value instead.
        if (this_arg.type === "variable" && !correct_type.includes("variable")) {

          // The name
          let id = this_arg.value.toUpperCase();

          // Bad name?
          if (!(id in this.env_vars)) return 0x0A;

          // Bad type?
          if (!correct_type.includes(this.env_vars[id].type) && !correct_type.includes("any"))
            return 0x02;

          // Add the variable's value
          this_arg = env_vars[id];
          mapped_args.push(this_arg);
          continue;
        }

        // Any specified? don't bother checking
        if (correct_type.includes("any")) {
          mapped_args.push(this_arg);
          continue;
        }

        // The types match? add the argument!
        if (correct_type.includes(this_arg.type)) {
          mapped_args.push(this_arg);
          continue;
        }

        // Nothing matched; the argument must have the wrong type
        return 0x02;
      }

      // If we haven't failed yet, run the command!
      return await cmd.action(...mapped_args);
    }

    /**
     * Asynchronously run a batch of commands until complete; async functions are
     * used to allow for pause / delay commands that don't freeze the browser.
     */
    async manage() {
      let batch_size = this.batch.length,
        error = 0x0,
        line;

      // current_line is incremented in the middle of the loop
      // so that a goto command can work.
      for (; this.current_line < batch_size;) {

        line = this.batch[this.current_line++];

        error = this.interpret(line);

        if (error) break;

        error = await this.execute();

        if (error) break;
      }

      return error;
    }

    /**
     * Gets called when an error is encountered.
     *
     * @param {number} error The numeric code of the error
     */
    onerror (error) { }

    /**
     * Runs a batch of commands, sequentially
     *
     * @param {string[]} cmds The commands to run, in order.
     */
    runBatch(cmds) {
      if (!this.done) throw "Unable to process batch! Commands are still running.";

      this.batch = [...cmds];
      this.current_line = 0;
      this.done = false;

      this.manage().then(e => {
        this.onerror(e);
        this.done = true;
      });
    }

    /**
     * Runs a single command, as opposed to a batch.
     *
     * @param {string} line Unprocessed text
     */
    runLine(line) {
      if (!this.done) throw "Unable to process line! Commands are still running.";

      this.done = false;

      let error = this.interpret(line);

      if (error) {
        this.onerror(error);
        this.done = true;
        return;
      }

      this.execute().then(e => {
        this.done = true;
        this.onerror(e);
      });
    }
  }
  output.Engine = CommandEngine;


  // Complete the parsing rules for the default types
  (udf => {
    // Filling out the type parseing & checks
    number.begin = (char, flags) => CommandEngine.numerals.includes(char) || char === "-";
    number.end = (char, flags) => !CommandEngine.numerals.includes(char);
    number.parse = (value) => {
      let v = parseFloat(value), t = "number";

      if (Number.isNaN(v)) t = "error";

      return new Value(v, t);
    };

    // IDK if this is even needed, but it's customizable! :p
    symbol.begin = (char, flags) => CommandEngine.symbols.includes(char);
    symbol.end = (char, flags) => !CommandEngine.symbols.includes(char);
    symbol.parse = (value) => CommandEngine.operators.includes(value) ? new Value(value, 'symbol') : new Value(null, 'error');

    variable.begin = (char, flags) => char === CommandEngine.variable;
    variable.end = (char, flags) => !CommandEngine.var_chars.includes(char);
    variable.parse = (value) => new Value(value, 'variable'); // It should've passed the tests from end()

    // This will probably be a problem if keywords are implemented;
    // Good thing priority exists =P
    bool.begin = (char, flags) => char === "t" || char === "f";
    bool.end = (char, flags) => CommandEngine.whitespace.includes(char);
    bool.parse = (value) => {
      let v = null, t = "error";
      switch (value.toUpperCase()) {
        case "T":
        case "TRUE": v = true; t = "bool"; break;
        case "F":
        case "FALSE": v = false; t = "bool"; break;
      }
      return new Value(v, t);
    };

    // The most complicated one, since escape characters exist :)
    string.begin = (char, flags) => {
      if (CommandEngine.quotes.includes(char)) {
        flags.string_qoutes = char;
        return true;
      }
      return false;
    };
    string.end = (char, flags) => {
      if (char === "\\") {
        flags.escape = true;
        flags.skip_char = true;
        return false;
      }
      if (flags.escape) return false;
      if (char === flags.string_qoutes) return true;
      return false;
    };
    string.parse = (value) => {
      return new Value(value.slice(1, -1), 'string');
    };
  })();

  // Export the library
  return root.Commander = output;
})(this);
