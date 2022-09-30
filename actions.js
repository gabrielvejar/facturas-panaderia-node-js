module.exports = {
  clickElement: async (page, selector) => {
    await page.waitForSelector(selector)
    await page.evaluate((selector) => {
      document.querySelector(selector).click()
    }, selector)
  },
  typeOnInput: async (page, selector, text, waitForTimeout = 0) => {
    await page.waitForSelector(selector)
    await page.waitForTimeout(waitForTimeout)
    await page.evaluate((selector) => {
      document.querySelector(selector).value = ''
    }, selector)
    await page.type(selector, text)
  },
}
