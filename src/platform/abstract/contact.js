class AbstractContactProxy {
  submit (formData) {
    throw new Error('AbstractContactProxy::check must be implemented for specific platform')
  }
}

module.exports = AbstractContactProxy
