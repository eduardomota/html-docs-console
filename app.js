var session = {
  pageCurrent: "index", // Page, current
  pageStart: "index", // Page, start
  pageHeader: "internal_header", // Page, header
  pageFooter: "internal_footer", // Page, footer
  pageNotFound: "internal_404", // Page, Not found 404
  pageHistory: [], // Page, history
  pageHideHeader: false,
  pageHideFooter: false,
  pageHideHFOnStart: true, // Page, hide header and footer if page is starting page

  contentsFolder: "./contents/", // Contents, folder
  contentsFileExtension: ".html", // Contents, file extension
  contentsHeaderId: "header",
  contentsBodyId: "body",
  contentsFooterId: "footer",

  cursorEnabled: true, // Cursor, enabled
  cursorId: "cursor", // Cursor, container id
  cursorChar: "_", // Cursor, cursor char
  cursorSpeed: 530, // Cursor, blinking speed

  typewriterEnabled: false, // Typewriter enabled
  typewriterSpeed: 350, // Typewriter, typing speed, (speed (ms) / contents character length)
  typewriterCurrentPos: 0,
};

document.onload = onPageLoad();

document.addEventListener('click', function(e) {
  if (e.target.tagName == "A") {
    var page = e.target.getAttribute("page");
    if (page === "HISTORYBACK") page = session.pageHistory[session.pageHistory.length - 2] || session.pageStart;
    session.pageCurrent = page;
    session.pageHistory.push(page);
    var {
      contentsFolder,
      contentsFileExtension,
      contentsHeaderId,
      contentsBodyId,
      contentsFooterId,
      pageHeader,
      pageFooter,
      pageHideHFOnStart
    } = session;
    var url = {
      header: `${contentsFolder}${pageHeader}${contentsFileExtension}`,
      body: `${contentsFolder}${page}${contentsFileExtension}`,
      footer: `${contentsFolder}${pageFooter}${contentsFileExtension}`
    };
    updatePageContents(
      contentsHeaderId,
      url.header,
      contentsBodyId,
      url.body,
      contentsFooterId,
      url.footer,
      session.pageCurrent,
      session.pageStart,
      pageHideHFOnStart);
  }
}, false);

/*
  onPageLoad
 */
function onPageLoad() {
  var {
    contentsFolder,
    contentsFileExtension,
    pageHeader,
    pageStart,
    pageFooter,
    contentsHeaderId,
    contentsBodyId,
    contentsFooterId,
    pageHideHFOnStart
  } = session;
  var url = {
    header: `${contentsFolder}${pageHeader}${contentsFileExtension}`,
    body: `${contentsFolder}${pageStart}${contentsFileExtension}`,
    footer: `${contentsFolder}${pageFooter}${contentsFileExtension}`
  };
  session.pageHistory.push(pageStart);
  updatePageContents(
    contentsHeaderId,
    url.header,
    contentsBodyId,
    url.body,
    contentsFooterId,
    url.footer,
    session.pageCurrent,
    session.pageStart,
    pageHideHFOnStart);

  var {
    cursorEnabled,
    cursorId,
    cursorSpeed,
    cursorChar
  } = session;
  blinkCursor(cursorEnabled,
    cursorId,
    cursorChar,
    cursorSpeed);
}

/*
  blinkCursor
 */
function blinkCursor(
  enabled = true, // Enable cursor
  container = null, // Container id
  character = "_", // Cursor character
  speed = 530 // Cursor speed
) {
  if (enabled === false) return;

  document.getElementById(container).innerHTML = character;
  window.cursorToggle = true;

  setInterval((container) => {
    document.getElementById(container).style.opacity = window.cursorToggle ? 0 : 1;
    window.cursorToggle = window.cursorToggle ? false : true;
  }, speed, container);
}

/*
  removeContentsById
 */
function removeContentsById(
  containerId
) {
  var container = document.getElementById(containerId);
  while (container.firstChild) container.removeChild(container.firstChild);
}

/*
  updatePageContents
 */
async function updatePageContents(
  headerId,
  headerUrl,
  bodyId,
  bodyUrl,
  footerId,
  footerUrl,
  pageCurrent,
  pageStart,
  hideHFOnStart = false,
  hideHeader = false,
  hideFooter = false,
  typewriter = true,
  typewriterSpeed = 530,
) {
  var contents = {
    plain: {
      header: "",
      body: "",
      footer: ""
    },
    sanatized: {
      header: "",
      body: "",
      footer: ""
    }
  };

  contents.plain.header = await makeGetRequest(headerUrl);
  contents.plain.footer = await makeGetRequest(footerUrl);
  try {
    contents.plain.body = await makeGetRequest(bodyUrl);
  } catch {
    contents.plain.body = await makeGetRequest(`${session.contentsFolder}${session.pageNotFound}${session.contentsFileExtension}`);
  }

  contents.sanatized.header = stringSanatize(contents.plain.header);
  contents.sanatized.body = stringSanatize(contents.plain.body);
  contents.sanatized.footer = stringSanatize(contents.plain.footer);

  contents.plain.header = stringEnableHtml(contents.plain.header);
  contents.plain.body = stringEnableHtml(contents.plain.body);
  contents.plain.footer = stringEnableHtml(contents.plain.footer);

  if (typewriter) typewriterSpeed = Math.round(typewriterSpeed / contents.length);

  removeContentsById(headerId);
  removeContentsById(bodyId);
  removeContentsById(footerId);

  if (hideHFOnStart !== true || pageCurrent != pageStart && hideHeader === false)
    typewrite(headerId, contents.sanatized.header, contents.plain.header, typewriterSpeed);
  typewrite(bodyId, contents.sanatized.body, contents.plain.body, typewriterSpeed);

  if (hideHFOnStart !== true || pageCurrent != pageStart && hideFooter === false)
    typewrite(footerId, contents.sanatized.footer, contents.plain.footer, typewriterSpeed);

}

/*
  makeGetRequest
 */
function makeGetRequest(url) {
  return new Promise(function(resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.onload = function() {
      if (this.status >= 200 && this.status < 300) {
        resolve(xhr.response);
      } else {
        reject({
          status: this.status,
          statusText: xhr.statusText
        });
      }
    };
    xhr.onerror = function() {
      reject({
        status: this.status,
        statusText: xhr.statusText
      });
    };
    xhr.send();
  });
}

/*
  stringEnableHtml
 */
function stringEnableHtml(string) {
  return string.replace(/(<a href=")?((https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)))(">(.*)<\/a>)?/gi, function() {
    return '<a href="' + arguments[2] + '">' + (arguments[7] || arguments[2]) + '</a>'
  });
}

/*
  stringStripHtmlTags
 */
function stringStripHtmlTags(string) {
  return string.replace(/(<([^>]+)>)/gi, "");
}

/*
  stringStripNewLines
 */
function stringStripNewlines(string) {
  return string.replace(/(?:\r\n|\r|\n)/g, '\n');
}

/*
  stringSanatize
 */
function stringSanatize(string) {
  return stringStripHtmlTags(stringStripNewlines(string));
}

/*
  typewrite
 */
function typewrite(containerId, sanatizedContents, contents, speed, i = 0) {
  //console.log(sanatizedContents);
  if (i < sanatizedContents.length) {
    document.getElementById(containerId).innerHTML += sanatizedContents.charAt(i);
    i++;
    setTimeout(typewrite.bind(this, containerId, sanatizedContents, contents, speed, i), speed);
  } else {
    i = 0;
    setTimeout(() => {
      document.getElementById(containerId).innerHTML = contents;
    }, 150);
  }
}
