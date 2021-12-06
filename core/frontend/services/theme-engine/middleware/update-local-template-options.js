const _ = require('lodash');
const hbs = require('../engine');
const urlUtils = require('../../../../shared/url-utils');
const customThemeSettingsCache = require('../../../../shared/custom-theme-settings-cache');
const labs = require('../../../../shared/labs');
const preview = require('../preview');

function updateLocalTemplateOptions(req, res, next) {
    const localTemplateOptions = hbs.getLocalTemplateOptions(res.locals);

    // adjust @site.url for http/https based on the incoming request
    const siteData = {
        url: urlUtils.urlFor('home', {secure: req.secure, trailingSlash: false}, true)
    };

    // @TODO: it would be nicer if this was proper middleware somehow...
    const previewData = preview.handle(req, Object.keys(customThemeSettingsCache.getAll()));

    // strip custom off of preview data so it doesn't get merged into @site
    const customThemeSettingsPreviewData = previewData.custom;
    delete previewData.custom;
    let customData = {};
    if (labs.isSet('customThemeSettings')) {
        customData = customThemeSettingsPreviewData;
    }

    // update site data with any preview values from the request
    Object.assign(siteData, previewData);

    const member = req.member ? {
        uuid: req.member.uuid,
        email: req.member.email,
        name: req.member.name,
        firstname: req.member.name && req.member.name.split(' ')[0],
        avatar_image: req.member.avatar_image,
        subscriptions: req.member.subscriptions && req.member.subscriptions.map((sub) => {
            return Object.assign({}, sub, {
                default_payment_card_last4: sub.default_payment_card_last4 || '****'
            });
        }),
        paid: req.member.status !== 'free'
    } : null;

    hbs.updateLocalTemplateOptions(res.locals, _.merge({}, localTemplateOptions, {
        data: {
            member: member,
            site: siteData,
            custom: customData,
            // @deprecated: a gscan warning for @blog was added before 3.0 which replaced it with @site
            blog: siteData
        }
    }));

    next();
}

module.exports = updateLocalTemplateOptions;