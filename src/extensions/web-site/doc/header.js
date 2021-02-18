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
  // eslint-disable-next-line no-undef
  if (document.querySelector('script[src="' + url + '"]')) {
    return true;
  }
  return new Promise((resolve) => {
    // eslint-disable-next-line no-undef
    const script = document.createElement('script');
    script.setAttribute('src', url);
    script.setAttribute('type', 'text/javascript');

    script.addEventListener(
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
    document.head.appendChild(script);
  });
}
