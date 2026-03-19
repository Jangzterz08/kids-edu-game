import { describe, it } from 'vitest';

describe('SEC-03: HTML entity escaping in email digests', () => {
  it.todo('buildEmailHtml escapes <script> tags in kid.name');
  it.todo('buildEmailHtml escapes & in kid.name to &amp;');
  it.todo('email subject line escapes kid names');
  it.todo('parentName in greeting is escaped');
  it.todo('undefined kid.name falls back to "Your child", not literal "undefined"');
});
