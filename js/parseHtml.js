require('speech-rule-engine');

processHtml = function(file, opt_output) {
  var output = opt_output || file;
  var html;
  sre.System.getInstance().processFile_(
    function(x) {html = sre.DomUtil.parseInput(x);}, file);
  replaceMath(html);
  cleanupHtml(html);
  addMathJax(html);
  sre.SystemExternal.fs.writeFileSync(output,
                                      sre.DomUtil.formatXml(html.toString()));
};

replaceMath = function(html) {
  // TODO: Replace tables first, then replace other math elements.
  var math = sre.XpathUtil.evalXPath('//math', html);
  math.forEach(replaceNode);
}

replaceNode = function(node) {
  var id = node.getAttribute('id');
  var display = node.getAttribute('display');
  var latex = node.getAttribute('alttext');
  var element = sre.DomUtil.createElement('span');
  element.setAttribute(
    'class', display === 'inline' ? 'math inline' : 'math display');
  element.setAttribute('id', id);
  var text = sre.DomUtil.createTextNode(
    (display === 'inline' ? '\\(' : '\\[') +
      latex +
      (display === 'inline' ? '\\)' : '\\]')
  );
  element.appendChild(text);
  sre.DomUtil.replaceNode(node, element);
};


cleanupHtml = function(html) {
  var nodes = sre.XpathUtil.evalXPath(
    '//div[contains(@class, "ltx_date")]', html);
  if (nodes.length) {
    var node = nodes[0];
    node.parentNode.removeChild(node);
  }
};


addMathJax = function(html) {
  var sreConfig = makeNode('script', {type: 'text/x-sre-config'});
  addTextNode(
    sreConfig,
    '\n{"json": "https://cdn.mathjax.org/mathjax/contrib/a11y/mathmaps"}\n');
  var mjConfig = makeNode('script', {type: 'text/x-mathjax-config'});
  addTextNode(
    mjConfig,
    '\nMathJax.Hub.Config({\n' +
      '  TeX: { equationNumbers: {autoNumber: "AMS"} },\n' +
      '  MMLorHTML: {MSIE: "HTML"},\n' +
      '  AssistiveMML: {disabled: true},\n' +
      '  "fast-preview": {disabled: true}\n' +
      '});\n' +
      'MathJax.Ajax.config.path["SRE"] = "../mathjax";\n'
  );
  var mjScript = makeNode(
    'script',
    {src: 'https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS_CHTML-full',
     type: 'text/javascript'
    })
  addTextNode(mjScript, ' ');
  var head = sre.XpathUtil.evalXPath('//head', html);
  var parent = head.length ? head[0] : html;
  parent.appendChild(sreConfig);
  parent.appendChild(mjConfig);
  parent.appendChild(mjScript);
};


makeNode = function(tag, attributes) {
  var node = sre.DomUtil.createElement(tag);
  for (var attr in attributes) {
    node.setAttribute(attr, attributes[attr]);
  }
  return node;
};


addTextNode = function(node, text) {
  var textNode = sre.DomUtil.createTextNode(text);
  node.appendChild(textNode);
};


XML_FILES = [
  '0109',
  '0217',
  '0304',
  '0411',
  '0517',
  '0610',
  '0709',
  '0813',
  '0911',
  '1007'
];


BASE_DIR = '/home/sorge/git/Randa/math-doc';


runExperiments = function() {
  for (var i = 0, file; file = XML_FILES[i]; i++) {
    processHtml(BASE_DIR + '/html/' + file + '.html',
                BASE_DIR + '/mathjax/' + file + '.html');
  }
};
