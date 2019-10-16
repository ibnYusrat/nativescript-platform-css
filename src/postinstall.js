
// Get the defaults
const CI = isenv(process.env.CI);
const COLOR = CI ? false : isenv(process.env.npm_config_color);

function isenv(val) {
  return !!val && val !== '0' && val !== 'false';
}

function log(value) {
  console.log(COLOR ? value : value.replace(/\u001B\[[\d|1;\d]+m/g, ''));
}