import canonical from '@segment/canonical';

/**
 * Return a default `options.context.page` object.
 *
 * https://segment.com/docs/spec/page/#properties
 *
 * @return {Object}
 */
export default function pageDefaults() {
  return {
    path: canonicalPath(),
    referrer: document.referrer,
    search: location.search,
    title: document.title,
    url: canonicalUrl(location.search)
  };
}

/**
 * Return the canonical path for the page.
 *
 * @return {string}
 */
function canonicalPath() {
  var canon = canonical();
  if (!canon) return window.location.pathname;

  const a = document.createElement('a');
  a.href = canon;
  return a.pathname.charAt(0) !== '/' ? '/' + a.pathname : a.pathname;
}

/**
 * Return the canonical URL for the page concat the given `search`
 * and strip the hash.
 *
 * @param {string} search
 * @return {string}
 */
function canonicalUrl(search) {
  var canon = canonical();
  if (canon) return canon.indexOf('?') > -1 ? canon : canon + search;
  var url = window.location.href;
  var i = url.indexOf('#');
  return i === -1 ? url : url.slice(0, i);
}
