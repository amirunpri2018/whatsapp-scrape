/** @type {import('ava').TestInterface} */
const test = require('ava');
const { isLead, parseLead } = require('./Messages');

test('valid lead text', t => {
    const text =
        '[AM] Saya simpan ya datanya\n' +
        'Name :   P    P m d   \n' +
        'Company :    PT. Mirzaz Tr   ';
    const actual = isLead(text);
    t.true(actual);
});

test('invalid lead text', t => {
    const text =
        '  [AM] Saya simpan ya datanya\n' +
        'Name :   P    P m d   \n' +
        'Company :    PT. Mirzaz Tr   ';
    const actual = isLead(text);
    t.false(actual);
});

test('parse lead', t => {
    const text =
        '[AM] Saya simpan ya datanya\n' +
        'Name :   P    P m d   \n' +
        'Company :    PT. Mirzaz Tr   ';

    /** @type {import('./Messages').Lead} */
    const expected = {
        owner: 'AM',
        name: 'P    P m d',
        company: 'PT. Mirzaz Tr'
    };

    const actual = parseLead(text);
    t.deepEqual(actual, expected);
});
