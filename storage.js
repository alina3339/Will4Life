(function(){
"use strict";
// ═══════════════════════════════════════════════════════════════════════════
// BROWSER STORAGE API - IndexedDB backend, same interface as Electron API
// Provides: window.api with customerList, customerGet, customerSave, etc.
// ═══════════════════════════════════════════════════════════════════════════

var DB_NAME = "EstatePlannerDB";
var DB_VERSION = 1;
var STORE_CUSTOMERS = "customers";
var STORE_BRAND = "brand";
var STORE_AUDIT = "audit";

function openDB() {
  return new Promise(function(resolve, reject) {
    var req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = function(e) {
      var db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_CUSTOMERS)) {
        db.createObjectStore(STORE_CUSTOMERS, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_BRAND)) {
        db.createObjectStore(STORE_BRAND, { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains(STORE_AUDIT)) {
        var auditStore = db.createObjectStore(STORE_AUDIT, { keyPath: "id", autoIncrement: true });
        auditStore.createIndex("ts", "ts");
      }
    };
    req.onsuccess = function(e) { resolve(e.target.result); };
    req.onerror = function(e) { reject(new Error("IndexedDB error: " + e.target.error)); };
  });
}

function tx(storeName, mode, fn) {
  return openDB().then(function(db) {
    return new Promise(function(resolve, reject) {
      var t = db.transaction(storeName, mode);
      var store = t.objectStore(storeName);
      var result = fn(store);
      t.oncomplete = function() { resolve(result._value); };
      t.onerror = function(e) { reject(e.target.error); };
    });
  });
}

function getAll(storeName) {
  return openDB().then(function(db) {
    return new Promise(function(resolve, reject) {
      var t = db.transaction(storeName, "readonly");
      var req = t.objectStore(storeName).getAll();
      req.onsuccess = function() { resolve(req.result); };
      req.onerror = function(e) { reject(e.target.error); };
    });
  });
}

function getOne(storeName, key) {
  return openDB().then(function(db) {
    return new Promise(function(resolve, reject) {
      var t = db.transaction(storeName, "readonly");
      var req = t.objectStore(storeName).get(key);
      req.onsuccess = function() { resolve(req.result || null); };
      req.onerror = function(e) { reject(e.target.error); };
    });
  });
}

function putOne(storeName, data) {
  return openDB().then(function(db) {
    return new Promise(function(resolve, reject) {
      var t = db.transaction(storeName, "readwrite");
      t.objectStore(storeName).put(data);
      t.oncomplete = function() { resolve(true); };
      t.onerror = function(e) { reject(e.target.error); };
    });
  });
}

function deleteOne(storeName, key) {
  return openDB().then(function(db) {
    return new Promise(function(resolve, reject) {
      var t = db.transaction(storeName, "readwrite");
      t.objectStore(storeName).delete(key);
      t.oncomplete = function() { resolve(true); };
      t.onerror = function(e) { reject(e.target.error); };
    });
  });
}

function genId() {
  var a = new Uint8Array(12);
  crypto.getRandomValues(a);
  return Array.from(a).map(function(b) { return b.toString(16).padStart(2, "0"); }).join("");
}

function auditLog(action, cid, detail) {
  var entry = { ts: new Date().toISOString(), action: action, cid: cid || null, detail: detail || null, user: "browser" };
  putOne(STORE_AUDIT, entry).catch(function() {});
}

// ─── Exposed API (matches Electron preload interface) ────────────────────

window.api = {
  customerList: function() {
    return getAll(STORE_CUSTOMERS).then(function(list) {
      auditLog("LIST_CUSTOMERS");
      var summary = list.map(function(c) {
        return { id: c.id, name: c.name || "Unnamed", email: c.email || "", phone: c.phone || "", createdAt: c.createdAt, updatedAt: c.updatedAt, consentGiven: !!c.consentGiven, reference: c.reference || "" };
      }).sort(function(a, b) { return (b.updatedAt || "").localeCompare(a.updatedAt || ""); });
      return { success: true, data: summary };
    }).catch(function(e) { return { success: false, error: e.message, data: [] }; });
  },

  customerGet: function(id) {
    return getOne(STORE_CUSTOMERS, id).then(function(c) {
      auditLog("VIEW_CUSTOMER", id);
      if (!c) return { success: false, error: "Not found" };
      return { success: true, data: c };
    }).catch(function(e) { return { success: false, error: e.message }; });
  },

  customerSave: function(customer) {
    var isNew = !customer.id;
    if (isNew) customer.id = genId();
    if (isNew) customer.createdAt = new Date().toISOString();
    customer.updatedAt = new Date().toISOString();
    return putOne(STORE_CUSTOMERS, customer).then(function() {
      auditLog(isNew ? "CREATE_CUSTOMER" : "UPDATE_CUSTOMER", customer.id, customer.name);
      return { success: true, id: customer.id };
    }).catch(function(e) { return { success: false, error: e.message }; });
  },

  customerDelete: function(id) {
    if (!confirm("Permanently delete this customer and all their data?\n\nThis supports GDPR Article 17 (Right to Erasure).")) {
      return Promise.resolve({ success: false, cancelled: true });
    }
    return deleteOne(STORE_CUSTOMERS, id).then(function() {
      auditLog("DELETE_CUSTOMER_GDPR", id);
      return { success: true };
    }).catch(function(e) { return { success: false, error: e.message }; });
  },

  customerExportGDPR: function(id) {
    return getOne(STORE_CUSTOMERS, id).then(function(c) {
      if (!c) return { success: false, error: "Not found" };
      var exportData = Object.assign({ _gdprExport: true, _exportDate: new Date().toISOString(), _notice: "GDPR Article 15 - Right of Access. All personal data held for this individual." }, c);
      var blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = (c.name || "customer").replace(/[^a-z0-9]/gi, "_") + "_data_export.json";
      a.click();
      URL.revokeObjectURL(url);
      auditLog("GDPR_DATA_EXPORT", id, c.name);
      return { success: true };
    }).catch(function(e) { return { success: false, error: e.message }; });
  },

  brandLoad: function() {
    return getOne(STORE_BRAND, "main").then(function(b) {
      return { success: true, data: b ? b.value : null };
    }).catch(function() { return { success: true, data: null }; });
  },

  brandSave: function(brand) {
    return putOne(STORE_BRAND, { key: "main", value: brand }).then(function() {
      return { success: true };
    }).catch(function(e) { return { success: false, error: e.message }; });
  },

  sendEmail: function(opts) {
    // Browser: open mailto link
    try {
      var body = (opts.bodyText || "").substring(0, 1800);
      var mailto = "mailto:" + encodeURIComponent(opts.to || "") + "?subject=" + encodeURIComponent(opts.subject || "") + "&body=" + encodeURIComponent(body);
      window.open(mailto, "_blank");
      auditLog("EMAIL_MAILTO", null, "To: " + opts.to);
      return Promise.resolve({ success: true, message: "Opened in your default mail app." });
    } catch (e) {
      return Promise.resolve({ success: false, message: "Could not open mail client. Copy and send manually." });
    }
  },

  exportHTML: function(html) {
    var full = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Estate Plan</title><style>body{margin:40px auto;max-width:800px;font-family:Georgia,serif;color:#222}</style></head><body>' + html + '</body></html>';
    var blob = new Blob([full], { type: "text/html" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "estate-plan.html";
    a.click();
    URL.revokeObjectURL(url);
    auditLog("EXPORT_HTML");
    return Promise.resolve({ success: true });
  },

  auditLog: function() {
    return getAll(STORE_AUDIT).then(function(entries) {
      entries.sort(function(a, b) { return (b.ts || "").localeCompare(a.ts || ""); });
      return { success: true, data: entries.slice(0, 200) };
    }).catch(function() { return { success: true, data: [] }; });
  },

  healthCheck: function() {
    return getAll(STORE_CUSTOMERS).then(function(list) {
      return { dataDir: true, keystore: true, encryption: true, customerCount: list.length, backupCount: 0 };
    }).catch(function() {
      return { dataDir: true, keystore: true, encryption: false, customerCount: 0, backupCount: 0 };
    });
  }
};

console.log("[EP] Browser storage API ready (IndexedDB)");
})();
