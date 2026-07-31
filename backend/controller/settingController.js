//models
const Setting = require("../models/Setting");
const mongoose = require("mongoose");

//global setting controller
const addGlobalSetting = async (req, res) => {
  try {
    const newGlobalSetting = new Setting(req.body);
    await newGlobalSetting.save();
    res.send({
      message: "Global Setting Added Successfully!",
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const LEGACY_CURRENCIES = new Set(["$", "€", "£", "USD", "EUR", "GBP", "Dollar", "Euro", "Pound"]);

const getGlobalSetting = async (req, res) => {
  try {
    // console.log("getGlobalSetting");

    const globalSetting = await Setting.findOne({ name: "globalSetting" });
    if (!globalSetting) {
      return res.status(200).send({});
    }
    const setting = { ...globalSetting.setting };
    if (!setting.default_currency || LEGACY_CURRENCIES.has(setting.default_currency)) {
      setting.default_currency = "₹";
    }
    res.send(setting);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const updateGlobalSetting = async (req, res) => {
  try {
    const { setting } = req.body;

    // Construct the $set object dynamically
    const setObject = Object.keys(setting).reduce((acc, key) => {
      acc[`setting.${key}`] = setting[key];
      return acc;
    }, {});

    const globalSetting = await Setting.findOneAndUpdate(
      { name: "globalSetting" },
      { $set: setObject },
      { new: true, upsert: true }
    );

    res.send({
      data: globalSetting,
      message: "Global Setting Update Successfully!",
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

//store setting controller
const addStoreSetting = async (req, res) => {
  try {
    const newStoreSetting = new Setting(req.body);
    await newStoreSetting.save();
    res.send({
      message: "Store Setting Added Successfully!",
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const sanitizePublicStoreSetting = (setting = {}) => {
  const {
    razorpay_secret,
    stripe_secret,
    google_secret,
    github_secret,
    facebook_secret,
    nextauth_secret,
    ...safeSetting
  } = setting;

  return safeSetting;
};

const getStoreSetting = async (req, res) => {
  try {
    const storeSetting = await Setting.findOne({ name: "storeSetting" });
    if (!storeSetting) {
      return res.status(200).send({});
    }
    res.send(sanitizePublicStoreSetting(storeSetting.setting));
  } catch (err) {
    res.status(500).send({
      message: err.message,
      stack: err.stack,
      error: err
    });
  }
};

const updateStoreSetting = async (req, res) => {
  try {
    const { setting } = req.body;

    // Dynamically build the update fields
    const updateFields = Object.keys(setting).reduce((acc, key) => {
      acc[`setting.${key}`] = setting[key];
      return acc;
    }, {});
    // Update the canonical storeSetting document (GET /store-setting/all)
    const storeSetting = await Setting.findOneAndUpdate(
      { name: "storeSetting" },
      { $set: updateFields },
      { new: true, upsert: true }
    );

    // Keep SEO meta_url in sync on storeCustomizationSetting when provided
    if (setting.meta_url) {
      await Setting.findOneAndUpdate(
        { name: "storeCustomizationSetting" },
        { $set: { "setting.seo.meta_url": setting.meta_url } },
        { upsert: false }
      );
    }

    res.send({
      data: storeSetting,
      message: "Store Setting Update Successfully!",
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

//online store customization controller
const addStoreCustomizationSetting = async (req, res) => {
  try {
    const newStoreCustomizationSetting = new Setting(req.body);
    const storeCustomizationSetting = await newStoreCustomizationSetting.save();

    res.send({
      data: storeCustomizationSetting,
      message: "Online Store Customization Setting Added Successfully!",
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getStoreCustomizationSetting = async (req, res) => {
  try {
    const { key, keyTwo } = req.query;
    // console.log("getStoreCustomizationSetting");

    // console.log("req query", req.query, "key", key, "keyTwo", keyTwo);

    let projection = {};
    if (key) {
      projection[`setting.${key}`] = 1;
    }
    if (keyTwo) {
      projection[`setting.${keyTwo}`] = 1;
    }

    // If neither key nor keyTwo is provided, fetch all settings
    if (!key && !keyTwo) {
      projection = { setting: 1 };
    }

    const storeCustomizationSetting = await Setting.findOne(
      { name: "storeCustomizationSetting" },
      projection
    );

    if (!storeCustomizationSetting) {
      return res.status(404).send({ message: "Settings not found" });
    }

    res.send(storeCustomizationSetting.setting);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

const getStoreSeoSetting = async (req, res) => {
  // console.log("getStoreSeoSetting");
  try {
    const storeCustomizationSetting = await Setting.findOne(
      {
        name: "storeCustomizationSetting",
      },
      { "setting.seo": 1, _id: 0 }
    );
    // console.log("storeCustomizationSetting", storeCustomizationSetting);
    res.send(storeCustomizationSetting?.setting || {});
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const updateStoreCustomizationSetting = async (req, res) => {
  try {
    const { setting } = req.body;

    // Dynamically build the update fields
    const updateFields = Object.keys(setting).reduce((acc, key) => {
      acc[`setting.${key}`] = setting[key];
      return acc;
    }, {});
    // Update the online store setting document
    const storeCustomizationSetting = await Setting.findOneAndUpdate(
      { name: "storeCustomizationSetting" },
      { $set: updateFields },
      { new: true, upsert: true }
    );

    // Keep canonical storeSetting.meta_url in sync when SEO is saved
    const seoMetaUrl = setting?.seo?.meta_url;
    if (seoMetaUrl) {
      await Setting.findOneAndUpdate(
        { name: "storeSetting" },
        { $set: { "setting.meta_url": seoMetaUrl, "setting.website_url": seoMetaUrl } }
      );
    }

    res.send({
      data: storeCustomizationSetting,
      message: "Online Store Customization Setting Update Successfully!",
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

module.exports = {
  addGlobalSetting,
  getGlobalSetting,
  updateGlobalSetting,
  addStoreSetting,
  getStoreSetting,
  updateStoreSetting,
  getStoreSeoSetting,
  addStoreCustomizationSetting,
  getStoreCustomizationSetting,
  updateStoreCustomizationSetting,
};
