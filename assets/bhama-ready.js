(function () {
  "use strict";

  function formatMoney(cents, format) {
    var value = (Number(cents || 0) / 100).toFixed(2);
    var money = value.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return (format || "Rs. {{amount}}")
      .replace(/\{\{\s*amount\s*\}\}/, money)
      .replace(/\{\{\s*amount_no_decimals\s*\}\}/, Math.round(Number(cents || 0) / 100));
  }

  function setLoading(button, isLoading, label) {
    if (!button) return;
    if (isLoading) {
      button.dataset.originalHtml = button.innerHTML;
      button.dataset.wasDisabled = button.disabled ? "true" : "false";
      button.classList.add("is-loading");
      button.disabled = true;
      button.textContent = label || "Please wait";
      return;
    }
    button.classList.remove("is-loading");
    button.disabled = button.dataset.wasDisabled === "true";
    if (button.dataset.originalHtml) button.innerHTML = button.dataset.originalHtml;
    delete button.dataset.originalHtml;
    delete button.dataset.wasDisabled;
  }

  function updateCartCount() {
    return fetch("/cart.js", { headers: { Accept: "application/json" } })
      .then(function (response) {
        if (!response.ok) throw new Error("The bag count couldn't be refreshed.");
        return response.json();
      })
      .then(function (cart) {
        document.querySelectorAll("[data-bhama-cart-count]").forEach(function (node) {
          node.textContent = cart.item_count;
        });
        return cart;
      });
  }

  function initReels() {
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
  }

  function initProduct() {
    var root = document.querySelector("[data-bhama-product]");
    var jsonNode = root && root.querySelector("[data-bhama-product-json], [data-bhama-variants]");
    if (!root || !jsonNode) return;

    var product = JSON.parse(jsonNode.textContent);
    var moneyFormat = root.dataset.moneyFormat || "Rs. {{amount}}";
    var form = root.querySelector("[data-bhama-product-form]");
    var variantInput = root.querySelector("[data-bhama-variant-id]");
    var variantSelect = root.querySelector("[data-bhama-variant-select]");
    var priceNode = root.querySelector("[data-bhama-price]");
    var compareNode = root.querySelector("[data-bhama-compare]");
    var stockNode = root.querySelector("[data-bhama-stock]");
    var addButton = root.querySelector("[data-bhama-add]");
    var addLabel = root.querySelector("[data-bhama-add-label]");
    var buyButton = root.querySelector("[data-bhama-buy-now]");
    var qtyInput = root.querySelector("[data-bhama-qty]");
    var message = root.querySelector("[data-bhama-form-message]");
    var selectedOptions = {};
    var currentVariant = findVariantById(variantInput && variantInput.value);

    root.querySelectorAll("[data-bhama-option-group]").forEach(function (group) {
      var position = Number(group.dataset.optionPosition) - 1;
      var active = group.querySelector(".is-active");
      if (active) selectedOptions[position] = active.dataset.bhamaOptionValue;
    });

    function showMessage(text, type) {
      if (!message) return;
      message.textContent = text || "";
      message.classList.toggle("is-error", type === "error");
      message.classList.toggle("is-success", type === "success");
    }

    function findVariantByOptions() {
      return product.variants.find(function (variant) {
        return variant.options.every(function (value, index) {
          return selectedOptions[index] === value;
        });
      });
    }

    function findVariantById(id) {
      return product.variants.find(function (variant) {
        return String(variant.id) === String(id);
      });
    }

    function showGalleryImage(mediaId) {
      if (!mediaId) return;
      var images = Array.prototype.slice.call(root.querySelectorAll("[data-bhama-image]"));
      var target = images.find(function (image) {
        return String(image.dataset.mediaId) === String(mediaId);
      });
      if (!target) return;

      images.forEach(function (image) {
        image.hidden = image !== target;
      });
      root.querySelectorAll("[data-bhama-thumbnail]").forEach(function (thumb) {
        var isActive = thumb.dataset.bhamaThumbnail === target.dataset.bhamaImage;
        thumb.classList.toggle("is-active", isActive);
        thumb.setAttribute("aria-pressed", isActive ? "true" : "false");
      });
    }

    function renderVariant(variant) {
      currentVariant = variant || null;
      var available = Boolean(variant && variant.available);
      if (variantInput && variant) variantInput.value = variant.id;
      if (variantSelect && variant) variantSelect.value = variant.id;
      if (priceNode && variant) priceNode.textContent = formatMoney(variant.price, moneyFormat);

      if (compareNode && variant) {
        if (variant.compare_at_price && variant.compare_at_price > variant.price) {
          compareNode.textContent = formatMoney(variant.compare_at_price, moneyFormat);
          compareNode.classList.remove("is-hidden");
        } else {
          compareNode.textContent = "";
          compareNode.classList.add("is-hidden");
        }
      }

      if (stockNode) {
        stockNode.textContent = !variant ? "Unavailable" : available ? "In stock" : "Sold out";
        stockNode.classList.toggle("is-sold-out", !available);
      }

      [addButton, buyButton].forEach(function (button) {
        if (button) button.disabled = !available;
      });
      if (addLabel) addLabel.textContent = available ? "Add to Cart" : "Sold Out";

      if (variant && variant.featured_media) showGalleryImage(variant.featured_media.id);
      showMessage("", "");
    }

    renderVariant(currentVariant);

    root.querySelectorAll("[data-bhama-thumbnail]").forEach(function (thumb) {
      thumb.addEventListener("click", function () {
        var index = thumb.dataset.bhamaThumbnail;
        root.querySelectorAll("[data-bhama-image]").forEach(function (image) {
          image.hidden = image.dataset.bhamaImage !== index;
        });
        root.querySelectorAll("[data-bhama-thumbnail]").forEach(function (other) {
          var active = other === thumb;
          other.classList.toggle("is-active", active);
          other.setAttribute("aria-pressed", active ? "true" : "false");
        });
      });
    });

    root.querySelectorAll("[data-bhama-option-value]").forEach(function (button) {
      button.addEventListener("click", function () {
        var group = button.closest("[data-bhama-option-group]");
        var position = Number(group.dataset.optionPosition) - 1;
        selectedOptions[position] = button.dataset.bhamaOptionValue;

        group.querySelectorAll("[data-bhama-option-value]").forEach(function (other) {
          var active = other === button;
          other.classList.toggle("is-active", active);
          other.setAttribute("aria-pressed", active ? "true" : "false");
        });

        renderVariant(findVariantByOptions());
      });
    });

    if (variantSelect) {
      variantSelect.addEventListener("change", function () {
        var variant = findVariantById(variantSelect.value);
        if (!variant) return;
        variant.options.forEach(function (value, index) {
          selectedOptions[index] = value;
          var group = root.querySelector('[data-option-position="' + (index + 1) + '"]');
          if (!group) return;
          group.querySelectorAll("[data-bhama-option-value]").forEach(function (button) {
            var active = button.dataset.bhamaOptionValue === value;
            button.classList.toggle("is-active", active);
            button.setAttribute("aria-pressed", active ? "true" : "false");
          });
        });
        renderVariant(variant);
      });
    }

    var minusButton = root.querySelector("[data-bhama-qty-minus]");
    var plusButton = root.querySelector("[data-bhama-qty-plus]");
    if (minusButton) {
      minusButton.addEventListener("click", function () {
        qtyInput.value = Math.max(1, Number(qtyInput.value || 1) - 1);
      });
    }
    if (plusButton) {
      plusButton.addEventListener("click", function () {
        qtyInput.value = Number(qtyInput.value || 1) + 1;
      });
    }

    function addToCart(redirectToCheckout) {
      var variant = currentVariant;
      if (!variant || !variant.available) {
        showMessage("This variant is currently sold out.", "error");
        return Promise.resolve();
      }

      var formData = new FormData();
      formData.append("id", variant.id);
      formData.append("quantity", Math.max(1, Number(qtyInput.value || 1)));

      setLoading(redirectToCheckout ? buyButton : addButton, true, redirectToCheckout ? "Opening checkout" : "Adding");
      showMessage("", "");

      return fetch("/cart/add.js", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: formData
      })
        .then(function (response) {
          if (!response.ok) {
            return response.json().then(function (error) {
              throw new Error(error.description || "Could not add item to cart.");
            });
          }
          return response.json();
        })
        .then(function () {
          return updateCartCount();
        })
        .then(function () {
          if (redirectToCheckout) {
            window.location.href = "/checkout";
            return;
          }
          showMessage("Added to bag. You can continue shopping or open your bag.", "success");
        })
        .catch(function (error) {
          showMessage(error.message || "Could not add item. Please try again.", "error");
        })
        .finally(function () {
          setLoading(addButton, false);
          setLoading(buyButton, false);
        });
    }

    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        addToCart(false);
      });
    }

    if (buyButton) {
      buyButton.addEventListener("click", function () {
        addToCart(true);
      });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    initReels();
    initProduct();
  });
})();
