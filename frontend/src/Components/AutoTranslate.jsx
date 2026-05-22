import { useEffect } from "react";
import { translateLiteral, useI18n } from "../lib/i18n";

const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "TEXTAREA", "INPUT", "SELECT", "OPTION"]);
const ATTRIBUTES = ["placeholder", "title", "aria-label", "alt"];

const shouldSkipNode = (node) => {
  const parent = node.parentElement;
  if (!parent) return true;
  if (SKIP_TAGS.has(parent.tagName)) return true;
  if (parent.closest("[data-no-auto-translate]")) return true;
  return false;
};

const translateElementAttributes = (element, language) => {
  ATTRIBUTES.forEach((attribute) => {
    if (!element.hasAttribute(attribute)) return;
    const current = element.getAttribute(attribute);
    const translated = translateLiteral(current, language);
    if (translated !== current) {
      element.setAttribute(attribute, translated);
    }
  });
};

const translateNodeTree = (root, language) => {
  const textWalker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes = [];

  while (textWalker.nextNode()) {
    textNodes.push(textWalker.currentNode);
  }

  textNodes.forEach((node) => {
    if (shouldSkipNode(node)) return;
    const translated = translateLiteral(node.nodeValue, language);
    if (translated !== node.nodeValue) {
      node.nodeValue = translated;
    }
  });

  if (root.nodeType === Node.ELEMENT_NODE) {
    translateElementAttributes(root, language);
  }

  root.querySelectorAll?.("*").forEach((element) => translateElementAttributes(element, language));
};

const AutoTranslate = () => {
  const { language } = useI18n();

  useEffect(() => {
    const root = document.getElementById("root");
    if (!root) return undefined;

    translateNodeTree(root, language);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            if (shouldSkipNode(node)) return;
            const translated = translateLiteral(node.nodeValue, language);
            if (translated !== node.nodeValue) {
              node.nodeValue = translated;
            }
            return;
          }

          if (node.nodeType === Node.ELEMENT_NODE) {
            translateNodeTree(node, language);
          }
        });

        if (mutation.type === "characterData") {
          const node = mutation.target;
          if (shouldSkipNode(node)) return;
          const translated = translateLiteral(node.nodeValue, language);
          if (translated !== node.nodeValue) {
            node.nodeValue = translated;
          }
        }

        if (mutation.type === "attributes") {
          translateElementAttributes(mutation.target, language);
        }
      });
    });

    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ATTRIBUTES,
    });

    return () => observer.disconnect();
  }, [language]);

  return null;
};

export default AutoTranslate;
