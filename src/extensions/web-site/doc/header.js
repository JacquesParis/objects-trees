/* eslint-disable no-undef */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function loadStyle(url) {
  // eslint-disable-next-line no-undef
  if (document.querySelector('link[href="' + url + '"]')) {
    return true;
  }
  return new Promise((resolve) => {
    // eslint-disable-next-line no-undef
    const link = document.createElement('link');
    link.setAttribute('href', url);
    link.setAttribute('rel', 'stylesheet');
    link.addEventListener(
      'load',
      () => {
        // eslint-disable-next-line no-undef
        window.setTimeout(() => {
          resolve(true);
        });
      },
      false,
    );
    // eslint-disable-next-line no-undef
    document.head.appendChild(link);
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function loadScript(url) {
  if (document.querySelector('script[src="' + url + '"]')) {
    if (
      'true' ===
      document
        .querySelector('script[src="' + url + '"]')
        .getAttribute('data-loading')
    ) {
      return new Promise((resolve, reject) => {
        document.querySelector('script[src="' + url + '"]').addEventListener(
          'load',
          () => {
            window.setTimeout(() => {
              resolve(true);
            });
          },
          false,
        );
      });
    } else {
      return true;
    }
  }
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.setAttribute('src', url);
    script.setAttribute('type', 'text/javascript');
    script.setAttribute('data-loading', 'true');

    script.addEventListener(
      'load',
      () => {
        document
          .querySelector('script[src="' + url + '"]')
          .setAttribute('data-loading', 'false');
        window.setTimeout(() => {
          resolve(true);
        });
      },
      false,
    );
    document.head.appendChild(script);
  });
}

const loadedObjects = {};

function httpGetAsync(theUrl, callback) {
  // eslint-disable-next-line no-undef
  const xmlHttp = new XMLHttpRequest();
  xmlHttp.onreadystatechange = () => {
    if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
      callback(xmlHttp.responseText);
    }
  };
  xmlHttp.open('GET', theUrl, true); // true for asynchronous
  xmlHttp.send(null);
}

function loadJson(url) {
  if ('loadJson_' + url in loadedObjects) {
    return loadedObjects['loadJson_' + url];
  }
  return new Promise((resolve, reject) => {
    httpGetAsync(url, (response) => {
      loadedObjects['loadJson_' + url] = JSON.parse(response);
      resolve(loadedObjects['loadJson_' + url]);
    });
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function loadPopup(uri) {
  if ('loadPopup_' + uri in loadedObjects) {
    return loadedObjects['loadPopup_' + uri];
  }
  const popupTemplate = await loadJson(uri);

  let popup = popupTemplate.text;
  for (const id in popupTemplate.uris) {
    popup = popup.replace(
      new RegExp(id, 'g'),
      // eslint-disable-next-line no-undef
      getPageHref({
        treeNode: {
          id: popupTemplate.uris[id].pageId,
          name: popupTemplate.uris[id].pageName,
        },
      }),
    );
  }
  loadedObjects['loadPopup_' + uri] = popup;
  return popup;
}
