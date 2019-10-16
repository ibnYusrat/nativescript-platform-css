
// Get the defaults
const plugin_name = process.env.npm_package_name || 'Unknown';
const CI = isenv(process.env.CI);
const COLOR = CI ? false : isenv(process.env.npm_config_color);

function isenv(val) {
  return !!val && val !== '0' && val !== 'false';
}

function log(value) {
  console.log(COLOR ? value : value.replace(/\u001B\[[\d|1;\d]+m/g, ''));
}

function padr(value, size) {
  while(value.length < size) {
	value += ' ';
  }
  return value;
}

function padc(value, size) {
  while(value.length < size) {
	value = ' ' + value + ' ';
  }
  return value.substr(0, size);
}


function highlight(value, color) {
  if (color == null) { color = "33"; }
  return "\u001B["+color+"m"+value+"\u001B[37m";
}
