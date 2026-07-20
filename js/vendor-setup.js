// Vendor Setup and Fallbacks
// This file sets up fallbacks in case external libraries fail to load

// Swiper Fallback
if (typeof Swiper === 'undefined') {
  window.Swiper = function() {
    console.warn('Swiper library not loaded');
    return {
      slideTo: function() {},
      slideNext: function() {},
      slidePrev: function() {},
    };
  };
}

// Bootstrap Fallback
if (typeof bootstrap === 'undefined' && typeof _ === 'undefined') {
  window.bootstrap = {};
}

// jQuery Fallback (minimal)
if (typeof jQuery === 'undefined') {
  window.jQuery = {
    fn: {},
    ready: function(cb) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', cb);
      } else {
        cb();
      }
    }
  };
}

console.log('Vendor libraries initialized');
