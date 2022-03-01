const CONFIG = require('config')
const { getIpBinaryRepresentation } = require('lib/network/ip_binary_representation')
const isPrivateUrl = require('lib/network/is_private_url')
const hostname = require('os').hostname()

require('should')

describe('getIpBinaryRepresentation', () => {
  it('should get an IPv4 binary representation', async () => {
    getIpBinaryRepresentation('125.150.225.166').should.equal('01111101100101101110000110100110')
  })

  it('should get an IPv6 binary representation', async () => {
    getIpBinaryRepresentation('fc00::').should.equal(repeat('1', 6) + repeat('0', 122))
    getIpBinaryRepresentation('fc00::ffff').should.equal(repeat('1', 6) + repeat('0', 106) + repeat('1', 16))
  })
})

describe('isPrivateUrl', () => {
  it('should detect private ipv4 URLs', async () => {
    ;(await isPrivateUrl('http://127.1')).should.be.true()
    ;(await isPrivateUrl('http://127.0.0.1')).should.be.true()
    ;(await isPrivateUrl('http://192.168.178.242')).should.be.true()
    ;(await isPrivateUrl('http://0xc0.0xa8.0xb2.0xf2')).should.be.true()
    ;(await isPrivateUrl('http://0300.0250.0262.0362')).should.be.true()
  })

  // Disabling this test as it depends on the local network setup
  xit('should detect domain name resolving to a private ip', async () => {
    ;(await isPrivateUrl(`http://${hostname}.local:9200`)).should.be.true()
  })

  // The test fails at DNS lookup with ENOTFOUND
  xit('should detect private ipv6 URLs', async () => {
    ;(await isPrivateUrl('http://[::1]')).should.be.true()
  })

  // This test actually does not test what it says
  // as in most test environment, elasticsearch host will just be localhost,
  // which is already covered by rules on private networks
  // This test would need to be run with a service on a public IP
  xit('should detect internal services', async () => {
    ;(await isPrivateUrl(CONFIG.elasticsearch.host)).should.be.true()
  })
})

const repeat = (character, length) => new Array(length).fill(character).join('')
