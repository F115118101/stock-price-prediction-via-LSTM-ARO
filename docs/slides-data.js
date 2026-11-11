// Combines all three parts of the presentation into the full 39 slides.
window.SLIDES_DATA = [
  ...(window.SLIDES_PART1 || []),
  ...(window.SLIDES_PART2 || []),
  ...(window.SLIDES_PART3 || [])
];
