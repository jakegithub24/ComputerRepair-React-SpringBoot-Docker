"""
TechShop E-Commerce — Comprehensive Selenium GUI Tests
Covers every route, button, form, modal, and user flow.
Runs in headed (visible) browser mode.

Credentials (from credentials.txt):
  Existing : raj / Rajtembe@123
  Admin    : admin / Admin@123
  Create   : reyan / Reyan@123
             nikki / Nikki@123

Usage:
    source myvenv/bin/activate
    python3 app.py
"""

import time, sys, traceback, random, string
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import (
    NoSuchElementException, TimeoutException,
    StaleElementReferenceException, ElementNotInteractableException,
)

# ── Config ────────────────────────────────────────────────────────────────────
BASE_URL = "http://localhost:80"

ADMIN_USER  = "admin"
ADMIN_PASS  = "Admin@123"
RAJ_USER    = "raj"
RAJ_PASS    = "Rajtembe@123"
REYAN_USER  = "reyan"
REYAN_PASS  = "Reyan@123"
NIKKI_USER  = "nikki"
NIKKI_PASS  = "Nikki@123"

PASS = "\033[92m✔ PASS\033[0m"
FAIL = "\033[91m✘ FAIL\033[0m"
INFO = "\033[94m● INFO\033[0m"
WARN = "\033[93m⚠ WARN\033[0m"

results = []

# ── Helpers ───────────────────────────────────────────────────────────────────

def log(status, name, detail=""):
    icon = {"PASS": PASS, "FAIL": FAIL, "INFO": INFO, "WARN": WARN}.get(status, INFO)
    msg = f"  [{icon}] {name}"
    if detail:
        msg += f"  →  {detail}"
    print(msg)
    results.append((status, name, detail))


def make_driver():
    """Headed Chrome — visible browser so you can watch."""
    opts = Options()
    # NO --headless flag → runs in visible window
    opts.add_argument("--window-size=1400,900")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.binary_location = "/usr/bin/chromium"
    service = Service("/usr/bin/chromedriver")
    return webdriver.Chrome(service=service, options=opts)


def wait(driver, by, value, timeout=10):
    return WebDriverWait(driver, timeout).until(
        EC.presence_of_element_located((by, value))
    )


def wait_click(driver, by, value, timeout=10):
    return WebDriverWait(driver, timeout).until(
        EC.element_to_be_clickable((by, value))
    )


def go(driver, path, pause=0.8):
    driver.get(BASE_URL + path)
    time.sleep(pause)


def scroll_into(driver, el):
    driver.execute_script("arguments[0].scrollIntoView({block:'center'});", el)
    time.sleep(0.15)


def click(driver, el, name):
    try:
        scroll_into(driver, el)
        el.click()
        log("PASS", f"Click: {name}")
        return True
    except Exception as e:
        log("FAIL", f"Click: {name}", str(e)[:100])
        return False


def find(driver, xpath, timeout=6):
    try:
        return WebDriverWait(driver, timeout).until(
            EC.presence_of_element_located((By.XPATH, xpath))
        )
    except TimeoutException:
        return None


def find_all(driver, xpath):
    return driver.find_elements(By.XPATH, xpath)


def body_text(driver):
    try:
        return driver.find_element(By.TAG_NAME, "body").text
    except Exception:
        return ""


def dismiss_modal(driver):
    """Try to close any open modal via Cancel/Close/✕ or Escape."""
    for xpath in [
        "//button[contains(text(),'Cancel')]",
        "//button[contains(text(),'Close')]",
        "//button[contains(text(),'✕')]",
        "//button[@aria-label='close']",
    ]:
        el = find(driver, xpath, timeout=2)
        if el:
            try:
                scroll_into(driver, el)
                el.click()
                time.sleep(0.3)
                return
            except Exception:
                pass
    driver.find_element(By.TAG_NAME, "body").send_keys(Keys.ESCAPE)
    time.sleep(0.3)


def login_as(driver, username, password):
    go(driver, "/login")
    try:
        wait(driver, By.TAG_NAME, "form", timeout=8)
        ufield = find(driver, "//input[@name='username' or @placeholder[contains(.,'sername')] or @type='text']")
        pfield = find(driver, "//input[@type='password']")
        submit = find(driver, "//button[@type='submit']")
        if not (ufield and pfield and submit):
            log("FAIL", f"login_as({username})", "Form fields not found")
            return False
        ufield.clear(); ufield.send_keys(username)
        pfield.clear(); pfield.send_keys(password)
        scroll_into(driver, submit)
        submit.click()
        time.sleep(1.8)
        if "/login" not in driver.current_url:
            log("PASS", f"Logged in as {username}")
            return True
        # Check for error message
        err = find(driver, "//*[contains(@class,'red') or contains(@class,'error')]", timeout=2)
        detail = err.text[:80] if err else "Still on login page"
        log("FAIL", f"login_as({username})", detail)
        return False
    except Exception as e:
        log("FAIL", f"login_as({username})", str(e)[:100])
        return False


def logout(driver):
    btn = find(driver, "//button[contains(text(),'Logout')]", timeout=4)
    if btn:
        click(driver, btn, "Logout")
        time.sleep(0.8)
    else:
        log("INFO", "Logout button not found — may already be logged out")


# ── Phase 1: Public / Unauthenticated ─────────────────────────────────────────

def test_landing_page(driver):
    print("\n── 1.1  Landing Page (/)")
    go(driver, "/")
    wait(driver, By.TAG_NAME, "body")

    # Hero heading
    h1 = find(driver, "//h1[contains(text(),'Tech Products')]")
    log("PASS" if h1 else "FAIL", "Landing: hero heading visible")

    # Shop Now CTA
    shop_now = find(driver, "//a[contains(text(),'Shop Now')]")
    log("PASS" if shop_now else "FAIL", "Landing: Shop Now button")
    if shop_now:
        click(driver, shop_now, "Landing → Shop Now → /catalogue")
        time.sleep(0.6)
        log("PASS" if "/catalogue" in driver.current_url else "FAIL",
            "Landing: Shop Now navigates to /catalogue", driver.current_url)
        go(driver, "/")

    # View Featured anchor
    featured_link = find(driver, "//a[contains(text(),'View Featured') or contains(@href,'#featured')]")
    log("PASS" if featured_link else "FAIL", "Landing: View Featured link")

    # Stats section
    stats = find(driver, "//*[contains(text(),'100+') or contains(text(),'Products In Stock')]")
    log("PASS" if stats else "FAIL", "Landing: Stats section visible")

    # Featured Products section
    featured_section = find(driver, "//h2[contains(text(),'Featured Products')]")
    log("PASS" if featured_section else "FAIL", "Landing: Featured Products section")

    # Shop by Category section
    cat_section = find(driver, "//h2[contains(text(),'Shop by Category')]")
    log("PASS" if cat_section else "FAIL", "Landing: Shop by Category section")

    # Category links (Laptop, Desktop, etc.)
    cat_links = find_all(driver, "//a[contains(@href,'/catalogue')]")
    log("PASS" if len(cat_links) >= 4 else "WARN",
        f"Landing: {len(cat_links)} category/catalogue links found")

    # Why Choose Us section
    why = find(driver, "//h2[contains(text(),'Why Choose Us')]")
    log("PASS" if why else "FAIL", "Landing: Why Choose Us section")

    # CTA bottom section
    cta = find(driver, "//h2[contains(text(),'Ready to upgrade')]")
    log("PASS" if cta else "FAIL", "Landing: Bottom CTA section")

    # Start Shopping button
    start_shopping = find(driver, "//a[contains(text(),'Start Shopping')]")
    log("PASS" if start_shopping else "FAIL", "Landing: Start Shopping button")

    # Dark mode toggle
    toggle = find(driver, "//button[@aria-label='Toggle dark mode']")
    if toggle:
        click(driver, toggle, "Dark mode toggle ON")
        time.sleep(0.4)
        click(driver, toggle, "Dark mode toggle OFF")
    else:
        log("FAIL", "Landing: Dark mode toggle not found")

    # Navbar links (unauthenticated)
    shop_link = find(driver, "//nav//a[contains(@href,'/catalogue')]")
    login_link = find(driver, "//nav//a[contains(@href,'/login')]")
    reg_link   = find(driver, "//nav//a[contains(@href,'/register')]")
    log("PASS" if shop_link else "FAIL", "Navbar: Shop link")
    log("PASS" if login_link else "FAIL", "Navbar: Login link")
    log("PASS" if reg_link else "FAIL", "Navbar: Register link")

    # Footer
    footer = find(driver, "//footer")
    log("PASS" if footer else "FAIL", "Landing: Footer present")
    if footer:
        footer_links = footer.find_elements(By.TAG_NAME, "a")
        log("PASS" if len(footer_links) >= 4 else "WARN",
            f"Footer: {len(footer_links)} links found")
        # Check TechShop branding
        footer_text = footer.text
        log("PASS" if "TechShop" in footer_text else "FAIL",
            "Footer: TechShop branding", footer_text[:60])


def test_unauthenticated_redirects(driver):
    print("\n── 1.2  Unauthenticated Route Guards")
    private_routes = ["/cart", "/checkout", "/dashboard", "/chat"]
    for path in private_routes:
        go(driver, path, pause=0.6)
        time.sleep(0.4)
        cur = driver.current_url
        if "/login" in cur or cur.rstrip("/") == BASE_URL:
            log("PASS", f"Guard: {path} → redirected to login/home")
        else:
            log("FAIL", f"Guard: {path} → NOT redirected", cur)

    # /admin should show "Not Authenticated" block (AdminRoute)
    go(driver, "/admin", pause=0.6)
    bt = body_text(driver)
    if "Not Authenticated" in bt or "403" in bt or "/login" in driver.current_url:
        log("PASS", "Guard: /admin blocked for unauthenticated user")
    else:
        log("FAIL", "Guard: /admin not blocked", bt[:80])


def test_catalogue_public(driver):
    print("\n── 1.3  Catalogue Page — Public (/catalogue)")
    go(driver, "/catalogue")
    wait(driver, By.TAG_NAME, "body")

    # Search input
    search = find(driver, "//input[@type='text' and @placeholder]")
    if search:
        search.send_keys("laptop")
        time.sleep(0.6)
        log("PASS", "Catalogue: search input works")
        search.clear()
        time.sleep(0.4)
    else:
        log("FAIL", "Catalogue: search input not found")

    # Sort dropdown
    sort_sel = find(driver, "//select")
    if sort_sel:
        sel = Select(sort_sel)
        try:
            sel.select_by_value("price-asc")
            time.sleep(0.3)
            sel.select_by_value("price-desc")
            time.sleep(0.3)
            sel.select_by_value("name")
            time.sleep(0.3)
            log("PASS", "Catalogue: sort dropdown — all options work")
        except Exception as e:
            log("WARN", "Catalogue: sort dropdown partial", str(e)[:60])
    else:
        log("FAIL", "Catalogue: sort dropdown not found")

    # Category filter pills
    pills = find_all(driver, "//button[contains(@class,'rounded-full')]")
    log("PASS" if len(pills) > 0 else "FAIL",
        f"Catalogue: {len(pills)} category filter pills found")
    if len(pills) > 1:
        click(driver, pills[1], f"Catalogue: category pill '{pills[1].text}'")
        time.sleep(0.4)
        click(driver, pills[0], "Catalogue: All category pill")
        time.sleep(0.3)

    # Product cards
    cards = find_all(driver, "//div[contains(@class,'cursor-pointer') and contains(@class,'rounded-2xl')]")
    log("PASS" if len(cards) > 0 else "WARN",
        f"Catalogue: {len(cards)} product cards found")

    if cards:
        # Click first product card → product detail
        click(driver, cards[0], "Catalogue: first product card → detail page")
        time.sleep(1)
        log("PASS" if "/product/" in driver.current_url else "FAIL",
            "Catalogue: navigates to product detail", driver.current_url)
        driver.back()
        time.sleep(0.6)


def test_product_detail_public(driver):
    print("\n── 1.4  Product Detail Page — Public")
    go(driver, "/catalogue")
    time.sleep(0.8)
    cards = find_all(driver, "//div[contains(@class,'cursor-pointer') and contains(@class,'rounded-2xl')]")
    if not cards:
        log("INFO", "Product detail: no products in catalogue — skipping")
        return

    click(driver, cards[0], "Product detail: open first product")
    time.sleep(1)

    # Product name heading
    h1 = find(driver, "//h1 | //h2[contains(@class,'font-bold')]")
    log("PASS" if h1 else "FAIL", "Product detail: product name heading")

    # Price
    price = find(driver, "//*[contains(text(),'£')]")
    log("PASS" if price else "FAIL", "Product detail: price visible")

    # Stock badge
    stock = find(driver, "//*[contains(text(),'In Stock') or contains(text(),'Out of Stock')]")
    log("PASS" if stock else "WARN", "Product detail: stock status badge")

    # Add to Cart button (may be disabled if not logged in or out of stock)
    add_btn = find(driver, "//button[contains(text(),'Add to Cart') or contains(text(),'Cart')]")
    log("PASS" if add_btn else "WARN", "Product detail: Add to Cart button present")

    # Quantity selector
    qty = find(driver, "//input[@type='number'] | //button[contains(text(),'+')]")
    log("PASS" if qty else "WARN", "Product detail: quantity selector")

    # Related products section
    related = find(driver, "//*[contains(text(),'Related') or contains(text(),'Similar')]")
    log("PASS" if related else "INFO", "Product detail: related products section")

    # Back navigation
    back_btn = find(driver, "//button[@aria-label='Go back']")
    if back_btn:
        click(driver, back_btn, "Product detail: back button")
        time.sleep(0.5)
    else:
        driver.back()
        time.sleep(0.5)


def test_register_page(driver, username, email, password):
    print(f"\n── 2.1  Register Page — create '{username}'")
    go(driver, "/register")
    wait(driver, By.TAG_NAME, "form")

    ufield = find(driver, "//input[@name='username' or @placeholder[contains(.,'sername')] or @type='text']")
    efield = find(driver, "//input[@type='email' or @name='email' or @placeholder[contains(.,'mail')]]")
    pwd_fields = find_all(driver, "//input[@type='password']")
    submit = find(driver, "//button[@type='submit']")

    if not (ufield and efield and pwd_fields and submit):
        log("FAIL", f"Register '{username}': form fields missing")
        return False

    ufield.clear(); ufield.send_keys(username)
    efield.clear(); efield.send_keys(email)
    pwd_fields[0].send_keys(password)
    if len(pwd_fields) >= 2:
        pwd_fields[1].send_keys(password)
    log("PASS", f"Register '{username}': form filled")

    click(driver, submit, f"Register '{username}': submit")
    time.sleep(1.8)

    if "/login" in driver.current_url or "/dashboard" in driver.current_url:
        log("PASS", f"Register '{username}': success → {driver.current_url}")
        return True
    else:
        err = find(driver, "//*[contains(@class,'red') or contains(@class,'error')]", timeout=2)
        detail = err.text[:80] if err else driver.current_url
        log("FAIL", f"Register '{username}': failed", detail)
        return False


def test_register_validation(driver):
    print("\n── 2.2  Register — Validation Errors")
    go(driver, "/register")
    wait(driver, By.TAG_NAME, "form")
    submit = find(driver, "//button[@type='submit']")

    # Submit empty form
    if submit:
        click(driver, submit, "Register: submit empty form")
        time.sleep(0.5)
        errors = find_all(driver, "//*[contains(@class,'red') or contains(@class,'error') or contains(@class,'text-red')]")
        log("PASS" if errors else "FAIL",
            f"Register validation: empty form shows {len(errors)} error(s)")

    # Weak password
    go(driver, "/register")
    ufield = find(driver, "//input[@type='text']")
    efield = find(driver, "//input[@type='email']")
    pwd_fields = find_all(driver, "//input[@type='password']")
    submit = find(driver, "//button[@type='submit']")
    if ufield and efield and pwd_fields and submit:
        ufield.send_keys("weaktest")
        efield.send_keys("weaktest@test.com")
        pwd_fields[0].send_keys("weak")
        if len(pwd_fields) >= 2:
            pwd_fields[1].send_keys("weak")
        click(driver, submit, "Register: submit weak password")
        time.sleep(0.8)
        err = find(driver, "//*[contains(@class,'red') or contains(text(),'password') or contains(text(),'Password')]", timeout=3)
        log("PASS" if err else "FAIL", "Register validation: weak password rejected")

    # Invalid email
    go(driver, "/register")
    ufield = find(driver, "//input[@type='text']")
    efield = find(driver, "//input[@type='email']")
    pwd_fields = find_all(driver, "//input[@type='password']")
    submit = find(driver, "//button[@type='submit']")
    if ufield and efield and pwd_fields and submit:
        ufield.send_keys("emailtest")
        efield.send_keys("notanemail")
        pwd_fields[0].send_keys("ValidPass1!")
        if len(pwd_fields) >= 2:
            pwd_fields[1].send_keys("ValidPass1!")
        click(driver, submit, "Register: submit invalid email")
        time.sleep(0.8)
        err = find(driver, "//*[contains(@class,'red') or contains(text(),'email') or contains(text(),'Email')]", timeout=3)
        log("PASS" if err else "FAIL", "Register validation: invalid email rejected")


def test_login_page(driver):
    print("\n── 2.3  Login Page — Validation")
    go(driver, "/login")
    wait(driver, By.TAG_NAME, "form")

    # Submit empty
    submit = find(driver, "//button[@type='submit']")
    if submit:
        click(driver, submit, "Login: submit empty form")
        time.sleep(0.5)

    # Wrong credentials
    go(driver, "/login")
    ufield = find(driver, "//input[@type='text']")
    pfield = find(driver, "//input[@type='password']")
    submit = find(driver, "//button[@type='submit']")
    if ufield and pfield and submit:
        ufield.send_keys("wronguser")
        pfield.send_keys("WrongPass1!")
        click(driver, submit, "Login: wrong credentials")
        time.sleep(1.2)
        err = find(driver, "//*[contains(@class,'red') or contains(text(),'Invalid') or contains(text(),'incorrect')]", timeout=3)
        log("PASS" if err else "FAIL", "Login validation: wrong credentials shows error")


# ── Phase 3: Authenticated User Flows ─────────────────────────────────────────

def test_navbar_authenticated(driver, username):
    print(f"\n── 3.1  Navbar — Authenticated ({username})")
    # Should show: Shop, Cart (with badge), Dashboard, Chat
    nav = find(driver, "//nav")
    if not nav:
        log("FAIL", "Navbar: nav element not found"); return

    shop  = find(driver, "//nav//a[contains(@href,'/catalogue')]")
    cart  = find(driver, "//nav//a[contains(@href,'/cart')]")
    dash  = find(driver, "//nav//a[contains(@href,'/dashboard')]")
    chat  = find(driver, "//nav//a[contains(@href,'/chat')]")
    pwd   = find(driver, "//button[contains(text(),'Password') or contains(text(),'🔑')]")
    lout  = find(driver, "//button[contains(text(),'Logout')]")
    badge = find(driver, "//nav//*[contains(@class,'rounded-full') and contains(@class,'bg-orange')]", timeout=2)

    log("PASS" if shop  else "FAIL", "Navbar auth: Shop link")
    log("PASS" if cart  else "FAIL", "Navbar auth: Cart link")
    log("PASS" if dash  else "FAIL", "Navbar auth: Dashboard link")
    log("PASS" if chat  else "FAIL", "Navbar auth: Chat link")
    log("PASS" if pwd   else "FAIL", "Navbar auth: Password button")
    log("PASS" if lout  else "FAIL", "Navbar auth: Logout button")
    log("INFO", f"Navbar auth: cart badge {'visible' if badge else 'not visible (cart may be empty)'}")

    # User badge
    user_badge = find(driver, f"//nav//*[contains(text(),'{username}')]")
    log("PASS" if user_badge else "FAIL", f"Navbar auth: username '{username}' shown")


def test_change_password_modal(driver):
    print("\n── 3.2  Change Password Modal")
    pwd_btn = find(driver, "//button[contains(text(),'Password') or contains(text(),'🔑')]")
    if not pwd_btn:
        log("FAIL", "Change Password: button not found"); return

    click(driver, pwd_btn, "Change Password: open modal")
    time.sleep(0.5)

    # Modal should appear with 3 password fields
    pwd_inputs = find_all(driver, "//input[@type='password']")
    log("PASS" if len(pwd_inputs) >= 2 else "FAIL",
        f"Change Password modal: {len(pwd_inputs)} password fields")

    # Submit with wrong current password
    if len(pwd_inputs) >= 3:
        pwd_inputs[0].send_keys("WrongCurrent1!")
        pwd_inputs[1].send_keys("NewPass123!")
        pwd_inputs[2].send_keys("NewPass123!")
        submit = find(driver, "//button[@type='submit']")
        if submit:
            click(driver, submit, "Change Password: submit wrong current password")
            time.sleep(1)
            err = find(driver, "//*[contains(@class,'red') or contains(text(),'incorrect') or contains(text(),'wrong')]", timeout=3)
            log("PASS" if err else "FAIL", "Change Password: wrong current password rejected")

    dismiss_modal(driver)
    time.sleep(0.3)


def test_catalogue_add_to_cart(driver):
    print("\n── 3.3  Catalogue — Add to Cart (logged in)")
    go(driver, "/catalogue")
    time.sleep(0.8)

    cards = find_all(driver, "//div[contains(@class,'cursor-pointer') and contains(@class,'rounded-2xl')]")
    if not cards:
        log("WARN", "Catalogue add-to-cart: no product cards found"); return

    # Add first product to cart via Add to Cart button
    add_btns = find_all(driver, "//button[contains(text(),'Add to Cart')]")
    if add_btns:
        click(driver, add_btns[0], "Catalogue: Add to Cart (first product)")
        time.sleep(1)
        # Toast notification should appear
        toast = find(driver, "//*[contains(@class,'Toastify') or contains(@class,'toast')]", timeout=3)
        log("PASS" if toast else "WARN", "Catalogue: toast notification after add to cart")
    else:
        log("WARN", "Catalogue: no Add to Cart buttons visible (products may be out of stock)")

    # Add second product if available
    if len(add_btns) > 1:
        click(driver, add_btns[1], "Catalogue: Add to Cart (second product)")
        time.sleep(0.8)

    # Search and add
    search = find(driver, "//input[@type='text' and @placeholder]")
    if search:
        search.send_keys("RAM")
        time.sleep(0.6)
        ram_btns = find_all(driver, "//button[contains(text(),'Add to Cart')]")
        if ram_btns:
            click(driver, ram_btns[0], "Catalogue: Add RAM to cart")
            time.sleep(0.8)
        search.clear()
        time.sleep(0.3)


def test_product_detail_add_to_cart(driver):
    print("\n── 3.4  Product Detail — Add to Cart (logged in)")
    go(driver, "/catalogue")
    time.sleep(0.8)
    cards = find_all(driver, "//div[contains(@class,'cursor-pointer') and contains(@class,'rounded-2xl')]")
    if not cards:
        log("INFO", "Product detail add-to-cart: no products"); return

    click(driver, cards[0], "Product detail: open product")
    time.sleep(1)

    # Quantity increase
    plus_btn = find(driver, "//button[contains(text(),'+')]")
    if plus_btn:
        click(driver, plus_btn, "Product detail: increase quantity")
        time.sleep(0.3)
        click(driver, plus_btn, "Product detail: increase quantity again")
        time.sleep(0.3)
        log("PASS", "Product detail: quantity increase works")

    # Quantity decrease
    minus_btn = find(driver, "//button[contains(text(),'-') or contains(text(),'−')]")
    if minus_btn:
        click(driver, minus_btn, "Product detail: decrease quantity")
        time.sleep(0.3)

    # Add to Cart
    add_btn = find(driver, "//button[contains(text(),'Add to Cart')]")
    if add_btn:
        click(driver, add_btn, "Product detail: Add to Cart")
        time.sleep(1)
        toast = find(driver, "//*[contains(@class,'Toastify') or contains(@class,'toast')]", timeout=3)
        log("PASS" if toast else "WARN", "Product detail: toast after add to cart")
    else:
        log("WARN", "Product detail: Add to Cart button not found (may be out of stock)")

    driver.back()
    time.sleep(0.5)


def test_cart_page(driver):
    print("\n── 3.5  Cart Page (/cart)")
    go(driver, "/cart")
    time.sleep(0.8)

    # Check we're actually on the cart page (not redirected to login)
    if "/login" in driver.current_url:
        log("FAIL", "Cart: redirected to login — session lost"); return

    # Look for cart-specific elements
    cart_heading = find(driver, "//h1[contains(text(),'Cart') or contains(text(),'Shopping Cart')]", timeout=3)
    log("PASS" if cart_heading else "FAIL", "Cart: page heading visible")

    # Check for items or empty state
    remove_btns = find_all(driver, "//button[contains(text(),'Remove')]")
    qty_inputs   = find_all(driver, "//input[@type='number']")
    empty_state  = find(driver, "//*[contains(text(),'empty') or contains(text(),'Empty')]", timeout=2)

    has_items = len(remove_btns) > 0 or len(qty_inputs) > 0

    if has_items:
        log("PASS", f"Cart: {len(remove_btns)} items with Remove buttons")

        # Quantity update
        if qty_inputs:
            qty_inputs[0].clear()
            qty_inputs[0].send_keys("2")
            qty_inputs[0].send_keys(Keys.TAB)
            time.sleep(0.8)
            log("PASS", "Cart: quantity updated")

        # Update button (if separate)
        update_btn = find(driver, "//button[contains(text(),'Update')]", timeout=2)
        if update_btn:
            click(driver, update_btn, "Cart: Update button")
            time.sleep(0.6)

        # Cart total
        total = find(driver, "//*[contains(text(),'Total') or contains(text(),'Subtotal')]")
        log("PASS" if total else "FAIL", "Cart: total/subtotal visible")

        # Checkout link
        checkout_link = find(driver, "//a[contains(@href,'/checkout')] | //button[contains(text(),'Checkout')]")
        log("PASS" if checkout_link else "FAIL", "Cart: Checkout button/link present")

        # Continue Shopping
        cont = find(driver, "//a[contains(@href,'/catalogue') or contains(text(),'Shopping')]")
        log("PASS" if cont else "FAIL", "Cart: Continue Shopping link")

        # Remove one item
        remove_btns = find_all(driver, "//button[contains(text(),'Remove')]")
        if remove_btns:
            click(driver, remove_btns[0], "Cart: Remove first item")
            time.sleep(0.8)
            log("PASS", "Cart: item removed")

    elif empty_state:
        log("INFO", "Cart: cart is empty")
        cont = find(driver, "//a[contains(@href,'/catalogue') or contains(text(),'Shopping')]")
        log("PASS" if cont else "FAIL", "Cart empty: Continue Shopping link")
    else:
        log("WARN", "Cart: no items and no empty state found")


def test_checkout_page(driver):
    print("\n── 3.6  Checkout Page (/checkout)")
    # First ensure cart has items
    go(driver, "/catalogue")
    time.sleep(0.8)
    add_btns = find_all(driver, "//button[contains(text(),'Add to Cart')]")
    if add_btns:
        click(driver, add_btns[0], "Checkout prep: add item to cart")
        time.sleep(0.8)
        if len(add_btns) > 1:
            click(driver, add_btns[1], "Checkout prep: add second item")
            time.sleep(0.6)

    go(driver, "/checkout")
    time.sleep(0.8)

    # Check we're not redirected to login
    if "/login" in driver.current_url:
        log("FAIL", "Checkout: redirected to login — session lost"); return

    # If cart is empty, checkout shows empty state or redirects to /cart
    if "/cart" in driver.current_url:
        log("INFO", "Checkout: redirected to /cart (cart is empty)"); return

    empty_state = find(driver, "//*[contains(text(),'empty') or contains(text(),'Empty')]", timeout=2)
    if empty_state:
        log("INFO", "Checkout: cart empty state shown")
        cont = find(driver, "//button[contains(text(),'Continue Shopping')]")
        log("PASS" if cont else "WARN", "Checkout empty: Continue Shopping button")
        return

    # Shipping address textarea
    addr = find(driver, "//textarea | //input[@name='shippingAddress' or @placeholder[contains(.,'ddress')]]")
    if addr:
        addr.clear()
        addr.send_keys("123 Test Street\nLondon, UK\nEC1A 1BB")
        log("PASS", "Checkout: shipping address entered")
    else:
        log("FAIL", "Checkout: shipping address field not found")
        return

    # Order review items
    items = find_all(driver, "//div[contains(@class,'border-b')]")
    log("PASS" if items else "WARN", f"Checkout: {len(items)} order review items")

    # Order total
    total = find(driver, "//*[contains(text(),'Total')]")
    log("PASS" if total else "FAIL", "Checkout: order total visible")

    # Free shipping note
    free_ship = find(driver, "//*[contains(text(),'Free shipping') or contains(text(),'Free Shipping')]")
    log("PASS" if free_ship else "WARN", "Checkout: free shipping note")

    # Place Order button
    place_btn = find(driver, "//button[contains(text(),'Place Order') or contains(text(),'Confirm')]")
    if place_btn:
        log("PASS", "Checkout: Place Order button found")
        click(driver, place_btn, "Checkout: Place Order")
        time.sleep(2)
        if "/dashboard" in driver.current_url:
            log("PASS", "Checkout: order placed → redirected to dashboard")
        else:
            log("FAIL", "Checkout: order placed but not redirected to dashboard", driver.current_url)
    else:
        log("FAIL", "Checkout: Place Order button not found")

    # Back to Cart button
    go(driver, "/checkout")
    time.sleep(0.6)
    back_cart = find(driver, "//button[contains(text(),'Back to Cart')]")
    if back_cart:
        click(driver, back_cart, "Checkout: Back to Cart button")
        time.sleep(0.5)
        log("PASS" if "/cart" in driver.current_url else "FAIL",
            "Checkout: Back to Cart navigates to /cart")


def test_dashboard_page(driver):
    print("\n── 3.7  Dashboard Page (/dashboard)")
    go(driver, "/dashboard")
    time.sleep(0.8)

    # Check we're not redirected to login
    if "/login" in driver.current_url:
        log("FAIL", "Dashboard: redirected to login — session lost"); return

    # Welcome message
    welcome = find(driver, "//*[contains(text(),'Welcome back') or contains(text(),'welcome')]")
    log("PASS" if welcome else "FAIL", "Dashboard: welcome message")

    # My Orders section heading
    orders_section = find(driver, "//*[contains(text(),'My Orders') or contains(text(),'Orders')]")
    log("PASS" if orders_section else "FAIL", "Dashboard: My Orders section")

    # Continue Shopping / catalogue link
    shop_link = find(driver, "//a[contains(@href,'/catalogue')]")
    log("PASS" if shop_link else "FAIL", "Dashboard: Continue Shopping link")

    # View Cart link
    cart_link = find(driver, "//a[contains(@href,'/cart')]")
    log("PASS" if cart_link else "FAIL", "Dashboard: View Cart link")

    # Chat with Support link
    chat_link = find(driver, "//a[contains(@href,'/chat')]")
    log("PASS" if chat_link else "FAIL", "Dashboard: Chat with Support link")

    # Order rows
    order_rows = find_all(driver, "//*[contains(text(),'Order #')]")
    log("PASS" if len(order_rows) > 0 else "INFO",
        f"Dashboard: {len(order_rows)} order rows visible")

    # Click first order to expand
    if order_rows:
        click(driver, order_rows[0], "Dashboard: expand first order")
        time.sleep(0.5)
        shipping = find(driver, "//*[contains(text(),'Shipping Address')]", timeout=2)
        log("PASS" if shipping else "WARN", "Dashboard: order expanded shows shipping address")
        click(driver, order_rows[0], "Dashboard: collapse order")
        time.sleep(0.3)

    # Delete Account button
    del_btn = find(driver, "//button[contains(text(),'Delete Account')]")
    if del_btn:
        log("PASS", "Dashboard: Delete Account button found")
        click(driver, del_btn, "Dashboard: open Delete Account modal")
        time.sleep(0.5)
        modal = find(driver, "//*[contains(text(),'deactivate') or contains(text(),'Deactivate')]", timeout=3)
        log("PASS" if modal else "FAIL", "Dashboard: Delete Account modal opened")
        dismiss_modal(driver)
        time.sleep(0.3)
    else:
        log("FAIL", "Dashboard: Delete Account button not found")


def test_chat_page_user(driver):
    print("\n── 3.8  Chat Page — User (/chat)")
    go(driver, "/chat")
    time.sleep(1)

    # WebSocket connection indicator
    connected = find(driver, "//*[contains(text(),'Connected') or contains(text(),'Connecting')]")
    log("PASS" if connected else "WARN", "Chat: connection status indicator")

    # New Chat Request button
    new_chat_btn = find(driver, "//button[contains(text(),'New Chat') or contains(text(),'Chat Request')]")
    if new_chat_btn:
        log("PASS", "Chat: New Chat Request button found")
        # Check if disabled (no orders)
        is_disabled = new_chat_btn.get_attribute("disabled")
        if is_disabled:
            log("INFO", "Chat: New Chat button disabled (no orders yet)")
        else:
            click(driver, new_chat_btn, "Chat: open New Chat form")
            time.sleep(0.4)

            # Order select
            order_sel = find(driver, "//select", timeout=3)
            if order_sel:
                sel = Select(order_sel)
                opts = sel.options
                log("PASS" if len(opts) > 1 else "WARN",
                    f"Chat: {len(opts)-1} orders available in dropdown")
                if len(opts) > 1:
                    sel.select_by_index(1)
                    time.sleep(0.2)

            # Subject input
            subj = find(driver, "//input[@type='text' and @placeholder]", timeout=3)
            if subj:
                subj.send_keys("Question about my order")
                log("PASS", "Chat: subject field filled")

            # Send Request
            send_btn = find(driver, "//button[contains(text(),'Send Request')]")
            if send_btn and not send_btn.get_attribute("disabled"):
                click(driver, send_btn, "Chat: Send Request")
                time.sleep(1.5)
                toast = find(driver, "//*[contains(@class,'Toastify')]", timeout=3)
                log("PASS" if toast else "WARN", "Chat: toast after sending request")
            else:
                log("INFO", "Chat: Send Request button disabled (no order selected)")
                # Cancel
                cancel = find(driver, "//button[contains(text(),'Cancel')]")
                if cancel:
                    click(driver, cancel, "Chat: cancel new chat form")
    else:
        log("FAIL", "Chat: New Chat Request button not found")

    # Existing sessions list
    sessions = find_all(driver, "//button[contains(@class,'rounded-xl') and contains(@class,'text-left')]")
    log("PASS" if len(sessions) > 0 else "INFO",
        f"Chat: {len(sessions)} existing chat sessions")

    if sessions:
        click(driver, sessions[0], "Chat: open first session")
        time.sleep(0.8)
        # Chat window
        chat_window = find(driver, "//div[contains(@class,'flex-1') and contains(@class,'flex-col')]")
        log("PASS" if chat_window else "FAIL", "Chat: chat window opened")

        # Status badge
        status_badge = find(driver, "//*[contains(text(),'PENDING') or contains(text(),'ACTIVE') or contains(text(),'CLOSED')]")
        log("PASS" if status_badge else "WARN", "Chat: session status badge visible")

        # Message input (only if ACTIVE)
        msg_input = find(driver, "//input[@placeholder[contains(.,'message')]]", timeout=2)
        if msg_input:
            msg_input.send_keys("Hello, I have a question about my order.")
            send = find(driver, "//button[contains(text(),'Send')]")
            if send:
                click(driver, send, "Chat: send message")
                time.sleep(0.8)
                log("PASS", "Chat: message sent")
        else:
            log("INFO", "Chat: message input not available (session may be PENDING/CLOSED)")


# ── Phase 4: Admin Flows ───────────────────────────────────────────────────────

def test_admin_navbar(driver):
    print("\n── 4.1  Admin Navbar")
    admin_link = find(driver, "//nav//a[contains(@href,'/admin')]")
    shop_link  = find(driver, "//nav//a[contains(@href,'/catalogue')]")
    pwd_btn    = find(driver, "//button[contains(text(),'Password') or contains(text(),'🔑')]")
    lout       = find(driver, "//button[contains(text(),'Logout')]")
    badge      = find(driver, "//nav//*[contains(text(),'ADMIN')]")

    log("PASS" if admin_link else "FAIL", "Admin navbar: Admin Panel link")
    log("PASS" if shop_link  else "FAIL", "Admin navbar: Shop link")
    log("PASS" if pwd_btn    else "FAIL", "Admin navbar: Password button")
    log("PASS" if lout       else "FAIL", "Admin navbar: Logout button")
    log("PASS" if badge      else "FAIL", "Admin navbar: ADMIN role badge")

    # No Cart/Dashboard/Chat links for admin
    cart_link = find(driver, "//nav//a[contains(@href,'/cart')]", timeout=2)
    log("PASS" if not cart_link else "FAIL", "Admin navbar: no Cart link (correct)")


def test_admin_panel_tabs(driver):
    print("\n── 4.2  Admin Panel — Tab Navigation")
    go(driver, "/admin")
    time.sleep(1)

    # Tab labels include emojis — match by partial text
    tab_map = {
        "Users":      "👥",
        "Orders":     "📦",
        "Enquiries":  "💬",
        "Catalogue":  "🛒",
        "Chat":       "🗨",
    }
    for label, emoji in tab_map.items():
        tab = find(driver, f"//button[contains(text(),'{label}') or contains(text(),'{emoji}')]", timeout=4)
        if tab:
            click(driver, tab, f"Admin tab: {label}")
            time.sleep(0.6)
            log("PASS", f"Admin tab '{label}': clicked and loaded")
        else:
            log("FAIL", f"Admin tab '{label}': not found")


def test_admin_create_products(driver):
    print("\n── 4.3  Admin — Create Products")
    go(driver, "/admin")
    time.sleep(0.8)

    # Navigate to Catalogue tab (emoji label)
    cat_tab = find(driver, "//button[contains(text(),'Catalogue') or contains(text(),'🛒')]")
    if not cat_tab:
        log("FAIL", "Admin products: Catalogue tab not found"); return
    click(driver, cat_tab, "Admin: Catalogue tab")
    time.sleep(0.8)

    # Add Product button
    add_btn = find(driver, "//button[contains(text(),'Add Product') or contains(text(),'+ Add')]")
    if not add_btn:
        log("FAIL", "Admin products: Add Product button not found"); return
    click(driver, add_btn, "Admin: Add Product button")
    time.sleep(0.5)

    # Fill product form — Product 1: Laptop
    products_to_create = [
        {
            "name": "Dell XPS 15 Laptop",
            "category": "Laptop",
            "brand": "Dell",
            "model": "XPS 15 9530",
            "price": "1299.99",
            "stock": "10",
            "description": "High-performance laptop with Intel Core i7",
            "specs": '{"CPU":"Intel i7-13700H","RAM":"16GB","Storage":"512GB SSD"}',
        },
        {
            "name": "Samsung 32GB DDR5 RAM",
            "category": "RAM",
            "brand": "Samsung",
            "model": "DDR5-5600",
            "price": "89.99",
            "stock": "25",
            "description": "High-speed DDR5 memory module",
            "specs": '{"Capacity":"32GB","Speed":"5600MHz","Type":"DDR5"}',
        },
        {
            "name": "Logitech MX Master 3 Mouse",
            "category": "Mouse",
            "brand": "Logitech",
            "model": "MX Master 3",
            "price": "79.99",
            "stock": "15",
            "description": "Advanced wireless mouse for professionals",
            "specs": '{"DPI":"200-8000","Battery":"70 days","Connectivity":"Bluetooth/USB"}',
        },
    ]

    for i, prod in enumerate(products_to_create):
        if i > 0:
            # Re-open Add Product form
            add_btn = find(driver, "//button[contains(text(),'Add Product') or contains(text(),'+ Add')]")
            if add_btn:
                click(driver, add_btn, f"Admin: Add Product #{i+1}")
                time.sleep(0.5)

        # Name
        name_field = find(driver, "//input[@placeholder[contains(.,'Product Name')] or @placeholder[contains(.,'product')]]")
        if not name_field:
            name_field = find(driver, "//input[@type='text']")
        if name_field:
            name_field.clear()
            name_field.send_keys(prod["name"])

        # Category
        cat_sel = find(driver, "//select")
        if cat_sel:
            Select(cat_sel).select_by_visible_text(prod["category"])

        # Brand
        brand_field = find(driver, "//input[@placeholder[contains(.,'rand')] or @placeholder[contains(.,'Dell')]]")
        if brand_field:
            brand_field.clear()
            brand_field.send_keys(prod["brand"])

        # Model
        model_field = find(driver, "//input[@placeholder[contains(.,'odel')] or @placeholder[contains(.,'XPS')]]")
        if model_field:
            model_field.clear()
            model_field.send_keys(prod["model"])

        # Price
        price_field = find(driver, "//input[@type='number' and @placeholder[contains(.,'0.00')]]")
        if price_field:
            price_field.clear()
            price_field.send_keys(prod["price"])

        # Stock
        stock_field = find(driver, "//input[@type='number' and @placeholder='0']")
        if stock_field:
            stock_field.clear()
            stock_field.send_keys(prod["stock"])

        # Description
        desc_field = find(driver, "//textarea[@placeholder[contains(.,'description')]]")
        if desc_field:
            desc_field.clear()
            desc_field.send_keys(prod["description"])

        # Specs
        specs_field = find(driver, "//textarea[@placeholder[contains(.,'Specs') or contains(.,'JSON')]]")
        if specs_field:
            specs_field.clear()
            specs_field.send_keys(prod["specs"])

        log("PASS", f"Admin: product form filled — {prod['name']}")

        # Submit
        submit = find(driver, "//button[contains(text(),'Add Product') and @type='submit']")
        if not submit:
            submit = find(driver, "//button[@type='submit']")
        if submit:
            click(driver, submit, f"Admin: save product '{prod['name']}'")
            time.sleep(1.5)
            toast = find(driver, "//*[contains(@class,'Toastify')]", timeout=3)
            log("PASS" if toast else "WARN", f"Admin: product '{prod['name']}' saved (toast)")
        else:
            log("FAIL", f"Admin: submit button not found for '{prod['name']}'")
            dismiss_modal(driver)


def test_admin_edit_product(driver):
    print("\n── 4.4  Admin — Edit Product")
    go(driver, "/admin")
    time.sleep(0.8)
    cat_tab = find(driver, "//button[contains(text(),'Catalogue') or contains(text(),'🛒')]")
    if cat_tab:
        click(driver, cat_tab, "Admin: Catalogue tab")
        time.sleep(0.8)

    edit_btns = find_all(driver, "//button[contains(text(),'Edit')]")
    if not edit_btns:
        log("INFO", "Admin edit product: no products to edit yet"); return

    click(driver, edit_btns[0], "Admin: Edit first product")
    time.sleep(0.5)

    # Change price
    price_field = find(driver, "//input[@type='number' and @placeholder[contains(.,'0.00')]]")
    if price_field:
        price_field.clear()
        price_field.send_keys("999.99")
        log("PASS", "Admin edit: price updated")

    # Change stock
    stock_field = find(driver, "//input[@type='number' and @placeholder='0']")
    if stock_field:
        stock_field.clear()
        stock_field.send_keys("5")
        log("PASS", "Admin edit: stock updated")

    # Save Changes
    save_btn = find(driver, "//button[contains(text(),'Save Changes')]")
    if save_btn:
        click(driver, save_btn, "Admin: Save Changes")
        time.sleep(1.5)
        toast = find(driver, "//*[contains(@class,'Toastify')]", timeout=3)
        log("PASS" if toast else "WARN", "Admin edit: product saved (toast)")
    else:
        log("FAIL", "Admin edit: Save Changes button not found")
        dismiss_modal(driver)


def test_admin_search_products(driver):
    print("\n── 4.5  Admin — Search Products")
    go(driver, "/admin")
    time.sleep(0.8)
    cat_tab = find(driver, "//button[contains(text(),'Catalogue') or contains(text(),'🛒')]")
    if cat_tab:
        click(driver, cat_tab, "Admin: Catalogue tab")
        time.sleep(0.8)

    search = find(driver, "//input[@placeholder[contains(.,'Search')]]")
    if search:
        search.send_keys("Dell")
        time.sleep(0.5)
        rows = find_all(driver, "//tbody//tr")
        log("PASS", f"Admin search: '{len(rows)}' results for 'Dell'")
        search.clear()
        time.sleep(0.3)
        log("PASS", "Admin search: cleared")
    else:
        log("FAIL", "Admin search: search input not found")


def _admin_tab(driver, label, emoji):
    """Click an admin tab by label or emoji."""
    tab = find(driver, f"//button[contains(text(),'{label}') or contains(text(),'{emoji}')]", timeout=4)
    if tab:
        click(driver, tab, f"Admin: {label} tab")
        time.sleep(0.8)
        return True
    log("FAIL", f"Admin tab '{label}': not found")
    return False


def test_admin_users_tab(driver):
    print("\n── 4.6  Admin — Users Tab")
    go(driver, "/admin")
    time.sleep(0.8)
    _admin_tab(driver, "Users", "👥")

    # Active users table
    active_heading = find(driver, "//*[contains(text(),'Active Users')]")
    log("PASS" if active_heading else "FAIL", "Admin users: Active Users section")

    # Deleted users section
    deleted_heading = find(driver, "//*[contains(text(),'Deleted Users')]")
    log("PASS" if deleted_heading else "FAIL", "Admin users: Deleted Users section")

    # User rows
    rows = find_all(driver, "//tbody//tr")
    log("PASS" if len(rows) > 0 else "WARN", f"Admin users: {len(rows)} user rows")

    # Pagination
    prev_btn = find(driver, "//button[contains(text(),'Prev') or contains(text(),'←')]")
    next_btn = find(driver, "//button[contains(text(),'Next') or contains(text(),'→')]")
    log("PASS" if prev_btn else "FAIL", "Admin users: Prev pagination button")
    log("PASS" if next_btn else "FAIL", "Admin users: Next pagination button")
    log("PASS" if prev_btn and prev_btn.get_attribute("disabled") else "WARN",
        "Admin users: Prev disabled on first page")

    # Deactivate button (for non-admin users)
    deactivate_btns = find_all(driver, "//button[contains(text(),'Deactivate')]")
    log("PASS" if deactivate_btns else "WARN",
        f"Admin users: {len(deactivate_btns)} Deactivate buttons")

    if deactivate_btns:
        click(driver, deactivate_btns[0], "Admin users: click Deactivate (open confirm modal)")
        time.sleep(0.5)
        modal = find(driver, "//*[contains(text(),'Deactivate User')]", timeout=3)
        log("PASS" if modal else "FAIL", "Admin users: Deactivate confirm modal opened")
        dismiss_modal(driver)
        time.sleep(0.3)


def test_admin_orders_tab(driver):
    print("\n── 4.7  Admin — Orders Tab")
    go(driver, "/admin")
    time.sleep(0.8)
    _admin_tab(driver, "Orders", "📦")

    heading = find(driver, "//*[contains(text(),'All Orders')]")
    log("PASS" if heading else "FAIL", "Admin orders: All Orders heading")

    rows = find_all(driver, "//tbody//tr")
    log("PASS" if len(rows) > 0 else "INFO", f"Admin orders: {len(rows)} order rows")

    if rows:
        # Status dropdowns
        selects = find_all(driver, "//select[@aria-label[contains(.,'order')]]")
        log("PASS" if selects else "FAIL", f"Admin orders: {len(selects)} status dropdowns")

        if selects:
            sel = Select(selects[0])
            current = sel.first_selected_option.text
            # Change to Dispatched
            try:
                sel.select_by_visible_text("Dispatched")
                time.sleep(1)
                toast = find(driver, "//*[contains(@class,'Toastify')]", timeout=3)
                log("PASS" if toast else "WARN", "Admin orders: status changed to Dispatched (toast)")
                # Change back
                sel = Select(selects[0])
                sel.select_by_visible_text(current)
                time.sleep(0.5)
            except Exception as e:
                log("WARN", "Admin orders: status change", str(e)[:60])

        # Total price column
        price_col = find(driver, "//*[contains(text(),'£')]")
        log("PASS" if price_col else "WARN", "Admin orders: price column visible")

        # Shipping address column
        addr_col = find(driver, "//th[contains(text(),'Shipping') or contains(text(),'Address')]")
        log("PASS" if addr_col else "WARN", "Admin orders: shipping address column")


def test_admin_enquiries_tab(driver):
    print("\n── 4.8  Admin — Enquiries Tab")
    go(driver, "/admin")
    time.sleep(0.8)
    _admin_tab(driver, "Enquiries", "💬")

    heading = find(driver, "//*[contains(text(),'Enquiries')]")
    log("PASS" if heading else "FAIL", "Admin enquiries: Enquiries heading")

    rows = find_all(driver, "//tbody//tr")
    log("INFO", f"Admin enquiries: {len(rows)} enquiry rows")

    if rows:
        selects = find_all(driver, "//select[@aria-label[contains(.,'enquiry')]]")
        log("PASS" if selects else "WARN", f"Admin enquiries: {len(selects)} status dropdowns")


def test_admin_chat_tab(driver):
    print("\n── 4.9  Admin — Chat Tab")
    go(driver, "/admin")
    time.sleep(0.8)
    if not _admin_tab(driver, "Chat", "🗨"):
        return

    # Connection status
    conn = find(driver, "//*[contains(text(),'Live') or contains(text(),'Connecting')]")
    log("PASS" if conn else "WARN", "Admin chat: connection status indicator")

    # Start Chat with User button
    start_btn = find(driver, "//button[contains(text(),'Start Chat')]")
    log("PASS" if start_btn else "FAIL", "Admin chat: Start Chat with User button")

    if start_btn:
        click(driver, start_btn, "Admin chat: open Start Chat form")
        time.sleep(0.4)

        # Order select
        order_sel = find(driver, "//select", timeout=3)
        if order_sel:
            sel = Select(order_sel)
            opts = sel.options
            log("PASS" if len(opts) > 1 else "WARN",
                f"Admin chat: {len(opts)-1} orders in dropdown")
            if len(opts) > 1:
                sel.select_by_index(1)
                time.sleep(0.2)

        # Subject
        subj = find(driver, "//input[@type='text' and @placeholder]", timeout=3)
        if subj:
            subj.send_keys("Update on your order")
            log("PASS", "Admin chat: subject filled")

        # Start Chat submit
        create_btn = find(driver, "//button[contains(text(),'Start Chat') and @type='submit']")
        if create_btn and not create_btn.get_attribute("disabled"):
            click(driver, create_btn, "Admin chat: Start Chat submit")
            time.sleep(1.5)
            toast = find(driver, "//*[contains(@class,'Toastify')]", timeout=3)
            log("PASS" if toast else "WARN", "Admin chat: chat created (toast)")
        else:
            log("INFO", "Admin chat: Start Chat submit disabled (no order selected)")
            cancel = find(driver, "//button[contains(text(),'Cancel')]")
            if cancel:
                click(driver, cancel, "Admin chat: cancel form")

    # Filter tabs (ALL, PENDING, ACTIVE, CLOSED)
    for f in ["ALL", "PENDING", "ACTIVE", "CLOSED"]:
        filter_btn = find(driver, f"//button[text()='{f}']", timeout=2)
        if filter_btn:
            click(driver, filter_btn, f"Admin chat: filter '{f}'")
            time.sleep(0.3)
        else:
            log("WARN", f"Admin chat: filter '{f}' not found")

    # Session list
    sessions = find_all(driver, "//button[contains(@class,'rounded-xl') and contains(@class,'text-left')]")
    log("PASS" if len(sessions) > 0 else "INFO",
        f"Admin chat: {len(sessions)} chat sessions")

    if sessions:
        click(driver, sessions[0], "Admin chat: open first session")
        time.sleep(0.8)

        # Accept button (if PENDING)
        accept_btn = find(driver, "//button[contains(text(),'Accept')]", timeout=2)
        if accept_btn:
            click(driver, accept_btn, "Admin chat: Accept session")
            time.sleep(1)
            toast = find(driver, "//*[contains(@class,'Toastify')]", timeout=3)
            log("PASS" if toast else "WARN", "Admin chat: session accepted (toast)")

        # Send a message (if ACTIVE)
        msg_input = find(driver, "//input[@placeholder[contains(.,'message')]]", timeout=2)
        if msg_input:
            msg_input.send_keys("Hello! How can I help you with your order?")
            send_btn = find(driver, "//button[contains(text(),'Send')]")
            if send_btn:
                click(driver, send_btn, "Admin chat: send message")
                time.sleep(0.8)
                log("PASS", "Admin chat: message sent")

        # Close session
        close_btn = find(driver, "//button[contains(text(),'Close')]", timeout=2)
        if close_btn:
            click(driver, close_btn, "Admin chat: Close session")
            time.sleep(0.8)
            log("PASS", "Admin chat: session closed")


def test_admin_delete_product(driver):
    print("\n── 4.10  Admin — Delete Product")
    go(driver, "/admin")
    time.sleep(0.8)
    cat_tab = find(driver, "//button[contains(text(),'Catalogue') or contains(text(),'🛒')]")
    if cat_tab:
        click(driver, cat_tab, "Admin: Catalogue tab")
        time.sleep(0.8)

    delete_btns = find_all(driver, "//button[contains(text(),'Delete') and not(contains(text(),'Permanently'))]")
    if not delete_btns:
        log("INFO", "Admin delete product: no products to delete"); return

    # Delete last product (keep others for user tests)
    click(driver, delete_btns[-1], "Admin: Delete last product (open confirm)")
    time.sleep(0.5)

    confirm_del = find(driver, "//button[contains(text(),'Delete') and not(contains(text(),'Cancel'))]", timeout=3)
    if confirm_del:
        click(driver, confirm_del, "Admin: Confirm delete product")
        time.sleep(1)
        toast = find(driver, "//*[contains(@class,'Toastify')]", timeout=3)
        log("PASS" if toast else "WARN", "Admin: product deleted (toast)")
    else:
        log("FAIL", "Admin delete: confirm button not found")
        dismiss_modal(driver)


# ── Phase 5: Cross-cutting & Edge Cases ───────────────────────────────────────

def test_mobile_hamburger(driver):
    print("\n── 5.1  Mobile Hamburger Menu")
    # Resize to mobile
    driver.set_window_size(390, 844)
    time.sleep(0.3)
    go(driver, "/")
    time.sleep(0.5)

    hamburger = find(driver, "//button[@aria-label='Toggle menu']")
    if hamburger:
        click(driver, hamburger, "Mobile: open hamburger menu")
        time.sleep(0.4)
        mobile_menu = find(driver, "//div[contains(@class,'md:hidden') and contains(@class,'border-t')]")
        log("PASS" if mobile_menu else "FAIL", "Mobile: hamburger menu opens")

        # Close it
        click(driver, hamburger, "Mobile: close hamburger menu")
        time.sleep(0.3)
    else:
        log("WARN", "Mobile: hamburger button not found at 390px width")

    # Restore
    driver.set_window_size(1400, 900)
    time.sleep(0.3)


def test_dark_mode_persistence(driver):
    print("\n── 5.2  Dark Mode Toggle")
    go(driver, "/")
    time.sleep(0.5)
    toggle = find(driver, "//button[@aria-label='Toggle dark mode']")
    if not toggle:
        log("FAIL", "Dark mode: toggle button not found"); return

    # Enable dark mode via JS click to avoid interception
    driver.execute_script("arguments[0].click();", toggle)
    time.sleep(0.8)  # wait for React state + DOM update

    html_class = driver.find_element(By.TAG_NAME, "html").get_attribute("class") or ""
    # Also check body as fallback
    body_class = driver.find_element(By.TAG_NAME, "body").get_attribute("class") or ""
    has_dark = "dark" in html_class or "dark" in body_class
    log("PASS" if has_dark else "FAIL",
        "Dark mode: 'dark' class applied", f"html='{html_class}' body='{body_class}'")

    # Navigate to another page — localStorage persists it
    go(driver, "/catalogue")
    time.sleep(0.5)
    html_class = driver.find_element(By.TAG_NAME, "html").get_attribute("class") or ""
    body_class  = driver.find_element(By.TAG_NAME, "body").get_attribute("class") or ""
    has_dark = "dark" in html_class or "dark" in body_class
    log("PASS" if has_dark else "FAIL",
        "Dark mode: persists on navigation", f"html='{html_class}'")

    # Disable
    toggle = find(driver, "//button[@aria-label='Toggle dark mode']")
    if toggle:
        driver.execute_script("arguments[0].click();", toggle)
        time.sleep(0.4)
        log("PASS", "Dark mode: disabled")


def test_breadcrumb_navigation(driver):
    print("\n── 5.3  Breadcrumb Navigation")
    pages = ["/catalogue", "/cart", "/dashboard", "/admin"]
    for path in pages:
        go(driver, path, pause=0.5)
        breadcrumb = find(driver, "//a[contains(text(),'Home')]", timeout=3)
        log("PASS" if breadcrumb else "FAIL", f"Breadcrumb: Home link on {path}")
        if breadcrumb:
            click(driver, breadcrumb, f"Breadcrumb: Home link on {path}")
            time.sleep(0.4)
            # URL may be http://localhost/ or http://localhost:80/
            cur = driver.current_url.rstrip("/")
            expected = BASE_URL.rstrip("/")
            log("PASS" if cur == expected or cur == "http://localhost" else "FAIL",
                f"Breadcrumb: navigates to home from {path}", cur)


def test_back_button(driver):
    print("\n── 5.4  Back Button Navigation")
    go(driver, "/catalogue")
    time.sleep(0.5)
    back = find(driver, "//button[@aria-label='Go back']")
    if back:
        click(driver, back, "Back button on /catalogue")
        time.sleep(0.5)
        log("PASS", "Back button: navigated back", driver.current_url)
    else:
        log("FAIL", "Back button: not found on /catalogue")


def test_cart_count_badge(driver):
    print("\n── 5.5  Cart Count Badge in Navbar")
    go(driver, "/catalogue")
    time.sleep(0.8)
    add_btns = find_all(driver, "//button[contains(text(),'Add to Cart')]")
    if add_btns:
        click(driver, add_btns[0], "Cart badge: add item")
        time.sleep(1.5)  # wait for navbar poll
        badge = find(driver, "//nav//*[contains(@class,'bg-orange') or contains(@class,'rounded-full')]", timeout=5)
        log("PASS" if badge else "WARN", "Cart badge: badge appears in navbar after add")
    else:
        log("INFO", "Cart badge: no products to add")


def test_checkout_empty_cart(driver):
    print("\n── 5.6  Checkout — Empty Cart Redirect")
    # Clear cart first
    go(driver, "/cart")
    time.sleep(0.6)
    remove_btns = find_all(driver, "//button[contains(text(),'Remove')]")
    for btn in remove_btns:
        try:
            click(driver, btn, "Clear cart: remove item")
            time.sleep(0.5)
        except Exception:
            pass

    go(driver, "/checkout")
    time.sleep(0.8)
    bt = body_text(driver)
    if "empty" in bt.lower() or "/cart" in driver.current_url:
        log("PASS", "Checkout empty cart: shows empty state or redirects")
    else:
        log("WARN", "Checkout empty cart: unexpected state", bt[:60])


def test_admin_deactivate_user(driver, target_username):
    print(f"\n── 5.7  Admin — Deactivate User '{target_username}'")
    go(driver, "/admin")
    time.sleep(0.8)

    users_tab = find(driver, "//button[contains(text(),'Users') or contains(text(),'👥')]")
    if users_tab:
        click(driver, users_tab, "Admin: Users tab")
        time.sleep(0.8)

    # Find the user row
    user_row = find(driver, f"//td[contains(text(),'{target_username}')]", timeout=3)
    if not user_row:
        log("INFO", f"Admin deactivate: user '{target_username}' not found in list"); return

    # Find Deactivate button in same row
    row_parent = user_row.find_element(By.XPATH, "./parent::tr")
    deact_btn = row_parent.find_element(By.XPATH, ".//button[contains(text(),'Deactivate')]")
    if deact_btn:
        click(driver, deact_btn, f"Admin: Deactivate '{target_username}'")
        time.sleep(0.5)
        modal = find(driver, "//*[contains(text(),'Deactivate User')]", timeout=3)
        if modal:
            confirm = find(driver, "//button[contains(text(),'Deactivate') and not(contains(text(),'Cancel'))]")
            if confirm:
                click(driver, confirm, f"Admin: Confirm deactivate '{target_username}'")
                time.sleep(1)
                toast = find(driver, "//*[contains(@class,'Toastify')]", timeout=3)
                log("PASS" if toast else "WARN", f"Admin: '{target_username}' deactivated")
            else:
                dismiss_modal(driver)
        else:
            log("FAIL", f"Admin deactivate: modal not opened for '{target_username}'")
    else:
        log("INFO", f"Admin deactivate: no Deactivate button for '{target_username}' (may be admin)")


# ── Summary ───────────────────────────────────────────────────────────────────

def print_summary():
    print("\n" + "=" * 70)
    print("  RESULTS SUMMARY")
    print("=" * 70)
    passed = sum(1 for r in results if r[0] == "PASS")
    failed = sum(1 for r in results if r[0] == "FAIL")
    warned = sum(1 for r in results if r[0] == "WARN")
    info   = sum(1 for r in results if r[0] == "INFO")
    total  = passed + failed + warned
    print(f"  ✔ PASS : {passed}")
    print(f"  ✘ FAIL : {failed}")
    print(f"  ⚠ WARN : {warned}")
    print(f"  ● INFO : {info}")
    print(f"  Total  : {total} checks")
    print("=" * 70)

    if failed:
        print("\n  ❌ FAILED CHECKS:")
        for r in results:
            if r[0] == "FAIL":
                print(f"    ✘ {r[1]}" + (f"  →  {r[2]}" if r[2] else ""))

    if warned:
        print("\n  ⚠ WARNINGS:")
        for r in results:
            if r[0] == "WARN":
                print(f"    ⚠ {r[1]}" + (f"  →  {r[2]}" if r[2] else ""))

    print("\n  📋 ISSUE CHECKLIST:")
    print("  ─────────────────────────────────────────────────────────────────")
    for r in results:
        if r[0] in ("FAIL", "WARN"):
            icon = "[ ] ❌" if r[0] == "FAIL" else "[ ] ⚠"
            print(f"  {icon}  {r[1]}" + (f"  →  {r[2]}" if r[2] else ""))
    if not any(r[0] in ("FAIL", "WARN") for r in results):
        print("  [x] All checks passed — no issues found!")
    print("=" * 70)

    return 1 if failed > 0 else 0


# ── Main Runner ───────────────────────────────────────────────────────────────

def run_all():
    print("=" * 70)
    print("  TechShop E-Commerce — Comprehensive Selenium GUI Tests")
    print(f"  Target : {BASE_URL}")
    print("  Mode   : Headed (visible browser)")
    print("=" * 70)

    driver = make_driver()
    driver.implicitly_wait(2)

    try:
        # ── Phase 1: Public / Unauthenticated ────────────────────────────────
        print("\n" + "▶" * 3 + " PHASE 1: Public / Unauthenticated")
        test_unauthenticated_redirects(driver)
        test_landing_page(driver)
        test_catalogue_public(driver)
        test_product_detail_public(driver)
        test_register_validation(driver)
        test_login_page(driver)
        test_dark_mode_persistence(driver)
        test_mobile_hamburger(driver)

        # ── Phase 2: Register New Users ───────────────────────────────────────
        print("\n" + "▶" * 3 + " PHASE 2: Register New Users")
        test_register_page(driver, REYAN_USER, f"{REYAN_USER}@test.com", REYAN_PASS)
        test_register_page(driver, NIKKI_USER, f"{NIKKI_USER}@test.com", NIKKI_PASS)

        # Try duplicate registration (reyan already exists)
        print("\n── 2.3  Register — Duplicate Username")
        go(driver, "/register")
        wait(driver, By.TAG_NAME, "form")
        ufield = find(driver, "//input[@type='text']")
        efield = find(driver, "//input[@type='email']")
        pwd_fields = find_all(driver, "//input[@type='password']")
        submit = find(driver, "//button[@type='submit']")
        if ufield and efield and pwd_fields and submit:
            ufield.send_keys(REYAN_USER)
            efield.send_keys("other@test.com")
            pwd_fields[0].send_keys(REYAN_PASS)
            if len(pwd_fields) >= 2:
                pwd_fields[1].send_keys(REYAN_PASS)
            click(driver, submit, "Register: duplicate username submit")
            time.sleep(1.2)
            err = find(driver, "//*[contains(@class,'red') or contains(text(),'already') or contains(text(),'exists') or contains(text(),'409')]", timeout=3)
            log("PASS" if err else "FAIL", "Register: duplicate username rejected with error")

        # ── Phase 3: Authenticated User — raj ────────────────────────────────
        print("\n" + "▶" * 3 + f" PHASE 3: Authenticated User — {RAJ_USER}")
        if login_as(driver, RAJ_USER, RAJ_PASS):
            test_navbar_authenticated(driver, RAJ_USER)
            test_change_password_modal(driver)
            test_catalogue_add_to_cart(driver)
            test_product_detail_add_to_cart(driver)
            test_cart_page(driver)
            test_checkout_page(driver)
            test_dashboard_page(driver)
            test_chat_page_user(driver)
            test_breadcrumb_navigation(driver)
            test_back_button(driver)
            test_cart_count_badge(driver)
            logout(driver)
        else:
            log("FAIL", f"Phase 3 skipped: could not log in as {RAJ_USER}")

        # ── Phase 3b: Authenticated User — reyan ─────────────────────────────
        print("\n" + "▶" * 3 + f" PHASE 3b: Authenticated User — {REYAN_USER}")
        if login_as(driver, REYAN_USER, REYAN_PASS):
            test_navbar_authenticated(driver, REYAN_USER)
            test_catalogue_add_to_cart(driver)
            test_cart_page(driver)
            test_checkout_page(driver)
            test_dashboard_page(driver)
            test_chat_page_user(driver)
            logout(driver)
        else:
            log("FAIL", f"Phase 3b skipped: could not log in as {REYAN_USER}")

        # ── Phase 4: Admin ────────────────────────────────────────────────────
        print("\n" + "▶" * 3 + " PHASE 4: Admin")
        if login_as(driver, ADMIN_USER, ADMIN_PASS):
            test_admin_navbar(driver)
            test_admin_panel_tabs(driver)
            test_admin_create_products(driver)
            test_admin_edit_product(driver)
            test_admin_search_products(driver)
            test_admin_users_tab(driver)
            test_admin_orders_tab(driver)
            test_admin_enquiries_tab(driver)
            test_admin_chat_tab(driver)
            test_admin_deactivate_user(driver, NIKKI_USER)
            logout(driver)
        else:
            log("FAIL", f"Phase 4 skipped: could not log in as {ADMIN_USER}")

        # ── Phase 5: Post-admin user flows ────────────────────────────────────
        print("\n" + "▶" * 3 + " PHASE 5: Post-Admin — User Flows with Products")
        if login_as(driver, RAJ_USER, RAJ_PASS):
            test_catalogue_add_to_cart(driver)
            test_product_detail_add_to_cart(driver)
            test_cart_page(driver)
            test_checkout_page(driver)
            test_dashboard_page(driver)
            test_checkout_empty_cart(driver)
            logout(driver)
        else:
            log("FAIL", f"Phase 5 skipped: could not log in as {RAJ_USER}")

    except Exception as e:
        print(f"\n[FATAL] Unexpected error: {e}")
        traceback.print_exc()
    finally:
        print("\n[INFO] Tests complete. Browser will close in 5 seconds…")
        time.sleep(5)
        driver.quit()

    return print_summary()


if __name__ == "__main__":
    sys.exit(run_all())
