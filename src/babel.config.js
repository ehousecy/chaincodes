module.exports = (api) => {
  api.cache(true);
  return {
    plugins: [
      '@babel/transform-modules-commonjs',
      '@babel/proposal-class-properties',
    ]
  };
};