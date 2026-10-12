document.addEventListener("DOMContentLoaded", function () {
  var updateCartCount = function (count) {
    document.querySelectorAll(".bhama-cart-count").forEach(function (el) {
      el.textContent = count;
    });
  };

  document.querySelectorAll("[data-bhama-product]").forEach(function (root) {
    var variantsEl = root.querySelector("[data-bhama-variants]");
    var variants = [];
    if (variantsEl) {
      try { variants = JSON.parse(variantsEl.textContent); } catch (e) { variants = []; }
    }
    var moneyFormat = (variantsEl && variantsEl.getAttribute("data-money-format")) || "{{amount}}";
    var formatMoney = function (cents) {
      var amount = (cents / 100).toLocaleString("en-IN", { minimumFractionDigits: cents % 100 === 0 ? 0 : 2 });
      return moneyFormat.replace(/\{\{\s*amount\s*\}\}/, amount);
    };

    var mainImage = root.querySelector("[data-bhama-main-image]");
    var thumbs = Array.prototype.slice.call(root.querySelectorAll("[data-bhama-thumb]"));
    thumbs.forEach(function (thumb) {
      thumb.addEventListener("click", function () {
        thumbs.forEach(function (t) { t.classList.remove("is-active"); });
        thumb.classList.add("is-active");
        if (mainImage) mainImage.src = thumb.getAttribute("data-full");
      });
    });

    var optionRows = Array.prototype.slice.call(root.querySelectorAll("[data-bhama-option-row]"));
    var variantIdInput = root.querySelector("[data-bhama-variant-id]");
    var priceEl = root.querySelector("[data-bhama-price]");
    var comparePriceEl = root.querySelector("[data-bhama-compare-price]");
    var stockEl = root.querySelector("[data-bhama-stock]");
    var addBtn = root.querySelector("[data-bhama-add]");
    var addLabel = root.querySelector("[data-bhama-add-label]");
    var buyNowBtn = root.querySelector("[data-bhama-buy-now]");
    var message = root.querySelector("[data-bhama-message]");
    var qtyInput = root.querySelector("[data-bhama-qty]");

    var getSelected = function () {
      return optionRows.map(function (row) {
        var active = row.querySelector("[data-bhama-option-value].is-active");
        return active ? active.getAttribute("data-bhama-option-value") : null;
      });
    };

    var findVariant = function (selected) {
      return variants.filter(function (variant) {
        var opts = [variant.option1, variant.option2, variant.option3];
        return selected.every(function (value, i) { return value === null || opts[i] === value; });
      })[0];
    };

    var applyVariant = function (variant) {
      if (!variant) {
        if (addBtn) addBtn.setAttribute("disabled", "disabled");
        if (buyNowBtn) buyNowBtn.setAttribute("disabled", "disabled");
        if (stockEl) stockEl.textContent = "Unavailable";
        return;
      }
      if (variantIdInput) variantIdInput.value = variant.id;
      if (priceEl) priceEl.textContent = formatMoney(variant.price);
      if (comparePriceEl) {
        if (variant.compare_at_price && variant.compare_at_price > variant.price) {
          comparePriceEl.textContent = formatMoney(variant.compare_at_price);
          comparePriceEl.style.display = "";
        } else {
          comparePriceEl.style.display = "none";
        }
      }
      if (variant.featured_image && mainImage) {
        mainImage.src = variant.featured_image.src;
      }
      if (stockEl) stockEl.textContent = variant.available ? "In stock" : "Sold out";
      [addBtn, buyNowBtn].forEach(function (btn) {
        if (!btn) return;
        if (variant.available) btn.removeAttribute("disabled");
        else btn.setAttribute("disabled", "disabled");
      });
      if (addLabel) addLabel.textContent = variant.available ? "Add to Cart" : "Sold Out";
    };

    optionRows.forEach(function (row) {
      var buttons = Array.prototype.slice.call(row.querySelectorAll("[data-bhama-option-value]"));
      buttons.forEach(function (button) {
        button.addEventListener("click", function () {
          buttons.forEach(function (b) { b.classList.remove("is-active"); });
          button.classList.add("is-active");
          applyVariant(findVariant(getSelected()));
        });
      });
    });

    if (qtyInput) {
      var minusBtn = root.querySelector("[data-bhama-qty-minus]");
      var plusBtn = root.querySelector("[data-bhama-qty-plus]");
      if (minusBtn) minusBtn.addEventListener("click", function () {
        qtyInput.value = Math.max(1, (parseInt(qtyInput.value, 10) || 1) - 1);
      });
      if (plusBtn) plusBtn.addEventListener("click", function () {
        qtyInput.value = (parseInt(qtyInput.value, 10) || 1) + 1;
      });
    }

    var addToCart = function (redirectToCheckout) {
      if (!variantIdInput) return;
      var qty = qtyInput ? Number(qtyInput.value || 1) : 1;
      if (message) message.textContent = "Adding to bag...";

      fetch("/cart/add.js", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ items: [{ id: Number(variantIdInput.value), quantity: qty }] })
      })
        .then(function (response) {
          if (!response.ok) return response.json().then(function (err) { throw err; });
          return response.json();
        })
        .then(function () {
          if (redirectToCheckout) {
            window.location.href = "/checkout";
            return;
          }
          return fetch("/cart.js")
            .then(function (res) { return res.json(); })
            .then(function (cart) {
              updateCartCount(cart.item_count);
              if (message) message.textContent = "Added to cart.";
            });
        })
        .catch(function (err) {
          if (message) message.textContent = (err && err.description) || "Couldn't add this item. Please try again.";
        });
    };

    var form = root.querySelector("#BhamaProductForm");
    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        addToCart(false);
      });
    }
    if (buyNowBtn) {
      buyNowBtn.addEventListener("click", function () {
        addToCart(true);
      });
    }
  });

  document.querySelectorAll("[data-bhama-reel]").forEach(function (tile) {
    var video = tile.querySelector("video");
    if (!video) return;

    tile.addEventListener("click", function () {
      document.querySelectorAll("[data-bhama-reel] video").forEach(function (other) {
        if (other !== video) other.pause();
      });

      if (video.paused) {
        video.muted = false;
        video.controls = true;
        video.play();
      } else {
        video.pause();
      }
    });

    video.addEventListener("pause", function () {
      video.controls = false;
      video.muted = true;
    });
  });
});
