/* © 2026 Ayanjit Shome. All rights reserved. Concept by Ayanjit Shome. */

// Inline GitHub mark. Lucide v1 dropped brand icons for trademark reasons.
// Linking to a GitHub repository with the Octocat is explicitly permitted
// under GitHub's brand guidelines, so we ship a tiny local SVG.
export const GithubMark = ({ className = "", ...rest }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    className={className}
    {...rest}
  >
    <path d="M12 .5C5.73.5.75 5.48.75 11.75c0 4.98 3.23 9.2 7.71 10.69.56.1.77-.24.77-.54 0-.27-.01-1.17-.02-2.11-3.14.68-3.8-1.33-3.8-1.33-.52-1.3-1.26-1.65-1.26-1.65-1.03-.7.08-.69.08-.69 1.14.08 1.74 1.17 1.74 1.17 1.01 1.73 2.65 1.23 3.3.94.1-.73.4-1.23.72-1.51-2.51-.29-5.15-1.25-5.15-5.57 0-1.23.44-2.24 1.16-3.03-.12-.29-.5-1.44.11-3 0 0 .94-.3 3.09 1.16a10.7 10.7 0 0 1 5.63 0C17.1 5.37 18.04 5.67 18.04 5.67c.61 1.56.23 2.71.11 3 .72.79 1.16 1.8 1.16 3.03 0 4.33-2.64 5.28-5.16 5.56.41.35.78 1.04.78 2.1 0 1.52-.01 2.74-.01 3.11 0 .3.2.65.78.54 4.47-1.49 7.7-5.71 7.7-10.69C23.25 5.48 18.27.5 12 .5z" />
  </svg>
);
