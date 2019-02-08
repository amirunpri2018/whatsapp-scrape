const auth = require('fastify-basic-auth');
const { username, password } = require('../../env');

const authenticate = { realm: 'Breef' };
function validate(usr, pass, req, reply, done) {
    return username === usr && password === pass
        ? done()
        : done(new Error('Invalid username or password'));
}

const basicAuth = () => ({ plugin: auth, options: { validate, authenticate } });

/** @param {import('fastify').FastifyInstance} fastify */
const basicAuthHook = fastify => ({
    name: 'preHandler',
    middleware: fastify.basicAuth
});

module.exports = { basicAuth, basicAuthHook };
