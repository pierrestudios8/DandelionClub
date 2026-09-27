/**
 * An all-placeholder journal post so tests can render the journal list and post
 * templates while the journal is empty. Loaded only when DC_FIXTURES is set.
 */
export const EXAMPLE_POST_ID = 'example-post';

export const examplePostBody = `TODO: the post itself, in short paragraphs.

## TODO: a subheading

TODO: more of the post.`;

export const examplePost = {
  title: 'TODO: example journal post (tests only)',
  date: '2026-09-05',
  author: 'TODO: author',
  tags: ['Plantings'],
  related: [{ collection: 'plantings', id: 'silukhanyo-primary-2026-08-29' }],
};
