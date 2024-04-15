/**
 * @module
 */
export const MyLib = (root => {
  root = root ?? self;

  return root.MyLib = {
    DUMMY: true
  };
}) (this);