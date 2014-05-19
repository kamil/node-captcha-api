var request = require('request');


var CaptchaApi;

CaptchaApi = (function () {
    function CaptchaApi(provider, apiSecret, checkInterval) {
        this.provider = provider;
        this.apiSecret = apiSecret;
        this.checkInterval = checkInterval;
        this.maxCheck = 5;
    }

    CaptchaApi.prototype.solve = function (data, cb) {
        var self = this;

        self.upload(data, function (error, captchaId) {
            self.check(captchaId, function (error, captchaText) {
                if (error) {
                    cb(error, null, null);
                } else {
                    cb(null, captchaText, captchaId);
                }
            });
        });
    };

    CaptchaApi.prototype.upload = function (data, cb) {
        request.post('http://' + this.provider + '/in.php', {
            form: {
                method: 'base64',
                key: this.apiSecret,
                body: data
            }
        }, function (error, response, body) {

            if (typeof cb !== 'function') return;

            if (error) {
                console.log('upload error', error)
            }

            if (body.indexOf('OK') === 0) {
                cb(null, body.split('|')[1]);
            } else {
                cb(new Error(body), null);
            }
        });
    };

    CaptchaApi.prototype.check = function (captchaId, cb) {
        var url = 'http://' + this.provider + '/res.php?key=' + this.apiSecret + '&action=get&id=' + captchaId;
        var self = this;

        request.get(url, function (error, response, body) {
            if (error) {
                cb(error, null);
            } else {
                if (body.indexOf('OK') === 0) {
                    cb(null, body.split('|')[1]);
                } else {
                    if (body === 'CAPCHA_NOT_READY') {
                        setTimeout(function () {
                            self.check(captchaId, cb);
                        }, self.checkInverval);
                    } else {
                        cb(new Error(error), null);
                    }
                }
            }
        });
    };

    return CaptchaApi;

})();

module.exports = CaptchaApi;