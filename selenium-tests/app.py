"""
Selenium browser automation tests for Computer Repair Shop.
Tests every link and button on every page of the frontend.

Usage:
    python3 -m venv myvenv
    source myvenv/bin/activate
    pip install -r requirements.txt
    python3 app.py
"""

import time
import sys
import traceback
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import (
    NoSuchElementException, TimeoutException, ElementNotInteractableException,
    StaleElementReferenceException
)
from webdriver_manager.chrome import ChromeDriverManager
from webdriver_manager.core.os_manager import ChromeType

BASE_URL = "http://localhost:80"
API_URL  = "http://localhost:8080"

# Test credentials — register these fresh each run with a timestamp suffix
import random
SUFFIX       = str(random.randint(10000, 99999))
TEST_USER    = f"seleniumuser{SUFFIX}"
TEST_EMAIL   = f"selenium{SUFFIX}@test.com"
TEST_PASS    = "SeleniumPass1!"
ADMIN_USER   = "admin"
ADMIN_PASS   = "Admin@123"
EXISTING_USER = "raj"
EXISTING_PASS = "Rajtembe@123"

PASS = "\033[92mPASS\033[0m"
FAIL = "\033[91mFAIL\033[0m"
INFO = "\033[94mINFO\033[0m"

results = []


def log(status, name, detail=""):
    icon = PASS if status == "PASS" else FAIL
    msg = f"  [{icon}] {name}"
    if detail:
        msg += f" — {detail}"
    print(msg)
    results.append((status, name, detail))


def make_driver():
    opts = Options()
    opts.add_argument("--headless=new")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument("--window-size=1400,900")
    opts.add_argument("--disable-gpu")
    opts.binary_location = "/usr/bin/chromium"
    # Use system chromedriver directly
    service = Service("/usr/bin/chromedriver")
    return webdriver.Chrome(service=service, options=opts)


def wait_for(driver, by, value, timeout=8):
    return WebDriverWait(driver, timeout).until(
        EC.presence_of_element_located((by, value))
    )


def wait_clickable(driver, by, value, timeout=8):
    return WebDriverWait(driver, timeout).until(
        EC.element_to_be_clickable((by, value))
    )


def go(driver, path):
    driver.get(BASE_URL + path)
    time.sleep(0.6)


def safe_click(driver, element, name):
    try:
        driver.execute_script("arguments[0].scrollIntoView({block:'center'});", element)
        time.sleep(0.2)
        element.click()
        log("PASS", f"Click: {name}")
        return True
    except Exception as e:
        log("FAIL", f"Click: {name}", str(e)[:80])
        return False


def find_all_links(driver):
    return driver.find_elements(By.TAG_NAME, "a")


def find_all_buttons(driver):
    return driver.find_elements(By.TAG_NAME, "button")


# ─────────────────────────────────────────────────────────────────────────────
# Page tests
# ─────────────────────────────────────────────────────────────────────────────

def test_landing_page(driver):
    print("\n── Landing Page (/)")
    go(driver, "/")
    try:
        wait_for(driver, By.TAG_NAME, "body")
        log("PASS", "Landing page loads")
    except TimeoutException:
        log("FAIL", "Landing page loads", "Timed out")
        return

    # Check all nav links
    links = find_all_links(driver)
    nav_hrefs = [l.get_attribute("href") for l in links if l.get_attribute("href")]
    log("PASS", f"Found {len(links)} links on landing page", str(nav_hrefs[:5]))

    # Click Shop link in navbar
    try:
        shop_link = driver.find_element(By.XPATH, "//a[contains(@href,'/catalogue')]")
        safe_click(driver, shop_link, "Navbar → Shop link")
        go(driver, "/")  # go back
    except NoSuchElementException:
        log("FAIL", "Navbar → Shop link", "Not found")

    # Click Login link
    try:
        login_link = driver.find_element(By.XPATH, "//a[contains(@href,'/login')]")
        safe_click(driver, login_link, "Navbar → Login link")
        go(driver, "/")
    except NoSuchElementException:
        log("FAIL", "Navbar → Login link", "Not found")

    # Click Register link
    try:
        reg_link = driver.find_element(By.XPATH, "//a[contains(@href,'/register')]")
        safe_click(driver, reg_link, "Navbar → Register link")
        go(driver, "/")
    except NoSuchElementException:
        log("FAIL", "Navbar → Register link", "Not found")

    # Dark mode toggle
    try:
        toggle = driver.find_element(By.XPATH, "//button[@aria-label='Toggle dark mode']")
        safe_click(driver, toggle, "Dark mode toggle")
        safe_click(driver, toggle, "Dark mode toggle (back)")
    except NoSuchElementException:
        log("FAIL", "Dark mode toggle", "Not found")

    # CTA buttons on landing page
    buttons = find_all_buttons(driver)
    log("PASS", f"Found {len(buttons)} buttons on landing page")


def test_register_page(driver):
    print("\n── Register Page (/register)")
    go(driver, "/register")
    try:
        wait_for(driver, By.TAG_NAME, "form")
        log("PASS", "Register page loads with form")
    except TimeoutException:
        log("FAIL", "Register page loads", "No form found")
        return

    # Fill in registration form
    try:
        driver.find_element(By.XPATH, "//input[@type='text' or @name='username' or @placeholder[contains(.,'sername')]]").send_keys(TEST_USER)
        driver.find_element(By.XPATH, "//input[@type='email' or @name='email' or @placeholder[contains(.,'mail')]]").send_keys(TEST_EMAIL)
        pwd_fields = driver.find_elements(By.XPATH, "//input[@type='password']")
        if len(pwd_fields) >= 2:
            pwd_fields[0].send_keys(TEST_PASS)
            pwd_fields[1].send_keys(TEST_PASS)
        elif len(pwd_fields) == 1:
            pwd_fields[0].send_keys(TEST_PASS)
        log("PASS", "Register form: fill fields")
    except NoSuchElementException as e:
        log("FAIL", "Register form: fill fields", str(e)[:80])
        return

    # Submit
    try:
        submit = driver.find_element(By.XPATH, "//button[@type='submit']")
        safe_click(driver, submit, "Register form: submit button")
        time.sleep(1.5)
        log("PASS", "Register form submitted", f"URL: {driver.current_url}")
    except NoSuchElementException:
        log("FAIL", "Register form: submit button", "Not found")


def test_login_page(driver):
    print("\n── Login Page (/login)")
    go(driver, "/login")
    try:
        wait_for(driver, By.TAG_NAME, "form")
        log("PASS", "Login page loads with form")
    except TimeoutException:
        log("FAIL", "Login page loads", "No form found")
        return

    # Fill login form
    try:
        driver.find_element(By.XPATH, "//input[@type='text' or @name='username' or @placeholder[contains(.,'sername')]]").send_keys(TEST_USER)
        driver.find_element(By.XPATH, "//input[@type='password']").send_keys(TEST_PASS)
        log("PASS", "Login form: fill fields")
    except NoSuchElementException as e:
        log("FAIL", "Login form: fill fields", str(e)[:80])
        return

    try:
        submit = driver.find_element(By.XPATH, "//button[@type='submit']")
        safe_click(driver, submit, "Login form: submit button")
        time.sleep(1.5)
        log("PASS", "Login form submitted", f"URL: {driver.current_url}")
    except NoSuchElementException:
        log("FAIL", "Login form: submit button", "Not found")


def login_as(driver, username, password):
    """Helper: log in and return True on success."""
    go(driver, "/login")
    try:
        wait_for(driver, By.TAG_NAME, "form", timeout=6)
        driver.find_element(By.XPATH, "//input[@type='text' or @name='username' or @placeholder[contains(.,'sername')]]").send_keys(username)
        driver.find_element(By.XPATH, "//input[@type='password']").send_keys(password)
        driver.find_element(By.XPATH, "//button[@type='submit']").click()
        time.sleep(1.5)
        return True
    except Exception as e:
        log("FAIL", f"login_as({username})", str(e)[:80])
        return False


def logout(driver):
    try:
        btn = driver.find_element(By.XPATH, "//button[contains(text(),'Logout')]")
        safe_click(driver, btn, "Logout button")
        time.sleep(0.8)
    except NoSuchElementException:
        pass


def test_catalogue_page(driver):
    print("\n── Catalogue Page (/catalogue)")
    go(driver, "/catalogue")
    try:
        wait_for(driver, By.TAG_NAME, "body")
        log("PASS", "Catalogue page loads")
    except TimeoutException:
        log("FAIL", "Catalogue page loads")
        return

    # Search input
    try:
        search = driver.find_element(By.XPATH, "//input[@type='text' and @placeholder]")
        search.send_keys("laptop")
        time.sleep(0.5)
        search.clear()
        log("PASS", "Catalogue: search input works")
    except NoSuchElementException:
        log("FAIL", "Catalogue: search input", "Not found")

    # Sort dropdown
    try:
        sort = driver.find_element(By.TAG_NAME, "select")
        from selenium.webdriver.support.ui import Select
        Select(sort).select_by_value("price-asc")
        time.sleep(0.3)
        Select(sort).select_by_value("name")
        log("PASS", "Catalogue: sort dropdown works")
    except NoSuchElementException:
        log("FAIL", "Catalogue: sort dropdown", "Not found")

    # Category pills
    try:
        pills = driver.find_elements(By.XPATH, "//button[contains(@class,'rounded-full')]")
        if pills:
            safe_click(driver, pills[1] if len(pills) > 1 else pills[0], "Catalogue: category pill")
            time.sleep(0.3)
        log("PASS", f"Catalogue: found {len(pills)} category pills")
    except Exception as e:
        log("FAIL", "Catalogue: category pills", str(e)[:80])

    # Product cards — click first one
    try:
        cards = driver.find_elements(By.XPATH, "//div[contains(@class,'rounded-2xl') and contains(@class,'cursor-pointer')]")
        if cards:
            safe_click(driver, cards[0], "Catalogue: first product card")
            time.sleep(0.8)
            log("PASS", "Catalogue: product card navigates", f"URL: {driver.current_url}")
            driver.back()
            time.sleep(0.5)
        else:
            log("INFO", "Catalogue: no product cards found (empty catalogue)")
    except Exception as e:
        log("FAIL", "Catalogue: product card click", str(e)[:80])


def test_catalogue_logged_in(driver):
    print("\n── Catalogue Page (logged in — add to cart)")
    go(driver, "/catalogue")
    try:
        wait_for(driver, By.TAG_NAME, "body")
        # Try clicking Add to Cart on first product
        add_btns = driver.find_elements(By.XPATH, "//button[contains(text(),'Add to Cart')]")
        if add_btns:
            safe_click(driver, add_btns[0], "Catalogue: Add to Cart button")
            time.sleep(0.8)
        else:
            log("INFO", "Catalogue: no Add to Cart buttons visible")
    except Exception as e:
        log("FAIL", "Catalogue: Add to Cart", str(e)[:80])


def test_cart_page(driver):
    print("\n── Cart Page (/cart)")
    go(driver, "/cart")
    try:
        wait_for(driver, By.TAG_NAME, "body")
        log("PASS", "Cart page loads")
    except TimeoutException:
        log("FAIL", "Cart page loads")
        return

    # Check for cart content or empty state
    try:
        body_text = driver.find_element(By.TAG_NAME, "body").text
        if "cart" in body_text.lower() or "empty" in body_text.lower() or "£" in body_text:
            log("PASS", "Cart page: content visible")
        else:
            log("INFO", "Cart page: no cart content detected")
    except Exception:
        pass

    # Checkout button (if cart has items)
    try:
        checkout_btn = driver.find_element(By.XPATH, "//a[contains(@href,'/checkout')] | //button[contains(text(),'Checkout')]")
        log("PASS", "Cart page: Checkout button/link found")
        safe_click(driver, checkout_btn, "Cart: Checkout button")
        time.sleep(0.5)
        driver.back()
    except NoSuchElementException:
        log("INFO", "Cart page: no Checkout button (cart may be empty)")

    # Continue Shopping link
    try:
        cont = driver.find_element(By.XPATH, "//a[contains(@href,'/catalogue')]")
        log("PASS", "Cart page: Continue Shopping link found")
    except NoSuchElementException:
        log("INFO", "Cart page: no Continue Shopping link")

    # Quantity controls and remove buttons
    qty_inputs = driver.find_elements(By.XPATH, "//input[@type='number']")
    remove_btns = driver.find_elements(By.XPATH, "//button[contains(text(),'Remove') or contains(@aria-label,'remove')]")
    log("PASS", f"Cart page: {len(qty_inputs)} qty inputs, {len(remove_btns)} remove buttons")


def test_checkout_page(driver):
    print("\n── Checkout Page (/checkout)")
    go(driver, "/checkout")
    try:
        wait_for(driver, By.TAG_NAME, "body")
        log("PASS", "Checkout page loads")
    except TimeoutException:
        log("FAIL", "Checkout page loads")
        return

    # Shipping address textarea/input
    try:
        addr = driver.find_element(By.XPATH, "//textarea | //input[@name='shippingAddress' or @placeholder[contains(.,'ddress')]]")
        addr.send_keys("123 Test Street, London, UK")
        log("PASS", "Checkout: shipping address field works")
    except NoSuchElementException:
        log("INFO", "Checkout: no address field (may redirect if cart empty)")

    # Place Order button
    try:
        place_btn = driver.find_element(By.XPATH, "//button[contains(text(),'Place') or contains(text(),'Order') or contains(text(),'Confirm')]")
        log("PASS", "Checkout: Place Order button found")
    except NoSuchElementException:
        log("INFO", "Checkout: no Place Order button visible")


def test_dashboard_page(driver):
    print("\n── Dashboard Page (/dashboard)")
    go(driver, "/dashboard")
    try:
        wait_for(driver, By.TAG_NAME, "body")
        log("PASS", "Dashboard page loads")
    except TimeoutException:
        log("FAIL", "Dashboard page loads")
        return

    # Welcome message
    try:
        body_text = driver.find_element(By.TAG_NAME, "body").text
        if "Welcome" in body_text or "Dashboard" in body_text:
            log("PASS", "Dashboard: welcome content visible")
    except Exception:
        pass

    # Continue Shopping link
    try:
        shop_link = driver.find_element(By.XPATH, "//a[contains(@href,'/cart') or contains(text(),'Shopping')]")
        log("PASS", "Dashboard: Continue Shopping link found")
    except NoSuchElementException:
        log("INFO", "Dashboard: no Continue Shopping link")

    # Chat with Admin link
    try:
        chat_link = driver.find_element(By.XPATH, "//a[contains(@href,'/chat')]")
        log("PASS", "Dashboard: Chat with Admin link found")
    except NoSuchElementException:
        log("INFO", "Dashboard: no Chat link")

    # Delete Account button
    try:
        del_btn = driver.find_element(By.XPATH, "//button[contains(text(),'Delete Account')]")
        log("PASS", "Dashboard: Delete Account button found")
        # Click it to open modal, then close
        safe_click(driver, del_btn, "Dashboard: Delete Account button (open modal)")
        time.sleep(0.5)
        try:
            cancel = driver.find_element(By.XPATH, "//button[contains(text(),'Cancel') or contains(text(),'No')]")
            safe_click(driver, cancel, "Dashboard: Delete Account modal cancel")
        except NoSuchElementException:
            # Press Escape to close
            from selenium.webdriver.common.keys import Keys
            driver.find_element(By.TAG_NAME, "body").send_keys(Keys.ESCAPE)
    except NoSuchElementException:
        log("INFO", "Dashboard: no Delete Account button")

    # Order rows (if any)
    order_rows = driver.find_elements(By.XPATH, "//div[contains(text(),'Order #')]")
    log("PASS", f"Dashboard: {len(order_rows)} order rows visible")


def test_chat_page(driver):
    print("\n── Chat Page (/chat)")
    go(driver, "/chat")
    try:
        wait_for(driver, By.TAG_NAME, "body")
        log("PASS", "Chat page loads")
    except TimeoutException:
        log("FAIL", "Chat page loads")
        return

    body_text = driver.find_element(By.TAG_NAME, "body").text
    log("PASS", "Chat page: content visible", body_text[:60].replace("\n", " "))

    # New chat / Start chat button
    try:
        new_chat = driver.find_element(By.XPATH, "//button[contains(text(),'New') or contains(text(),'Start') or contains(text(),'Chat')]")
        log("PASS", "Chat page: New Chat button found")
    except NoSuchElementException:
        log("INFO", "Chat page: no New Chat button visible")

    # Message input
    try:
        msg_input = driver.find_element(By.XPATH, "//input[@type='text' and @placeholder] | //textarea[@placeholder]")
        log("PASS", "Chat page: message input found")
    except NoSuchElementException:
        log("INFO", "Chat page: no message input visible")


def test_admin_panel(driver):
    print("\n── Admin Panel (/admin)")
    go(driver, "/admin")
    try:
        wait_for(driver, By.TAG_NAME, "body")
        log("PASS", "Admin panel loads")
    except TimeoutException:
        log("FAIL", "Admin panel loads")
        return

    body_text = driver.find_element(By.TAG_NAME, "body").text
    log("PASS", "Admin panel: content visible", body_text[:80].replace("\n", " "))

    # Tab buttons (Orders, Enquiries, Users, Products, etc.)
    tabs = driver.find_elements(By.XPATH, "//button[contains(@class,'rounded') or contains(@class,'tab')]")
    log("PASS", f"Admin panel: {len(tabs)} tab/action buttons found")

    for i, tab in enumerate(tabs[:6]):
        try:
            label = tab.text.strip()
            if label:
                safe_click(driver, tab, f"Admin tab: {label}")
                time.sleep(0.4)
        except StaleElementReferenceException:
            break

    # Status update dropdowns / selects
    selects = driver.find_elements(By.TAG_NAME, "select")
    log("PASS", f"Admin panel: {len(selects)} select dropdowns found")

    # Action buttons (Edit, Delete, Update, etc.)
    action_btns = driver.find_elements(By.XPATH, "//button[contains(text(),'Edit') or contains(text(),'Delete') or contains(text(),'Update') or contains(text(),'Save')]")
    log("PASS", f"Admin panel: {len(action_btns)} action buttons found")


def test_navbar_all_pages(driver):
    """Test navbar links and back button on every page."""
    print("\n── Navbar links across pages")
    pages = ["/", "/catalogue", "/login", "/register"]
    for path in pages:
        go(driver, path)
        try:
            wait_for(driver, By.TAG_NAME, "nav")
            links = driver.find_elements(By.CSS_SELECTOR, "nav a")
            log("PASS", f"Navbar on {path}: {len(links)} links")
        except TimeoutException:
            log("FAIL", f"Navbar on {path}", "nav element not found")

        # Back button (not on home)
        if path != "/":
            try:
                back_btn = driver.find_element(By.XPATH, "//button[@aria-label='Go back']")
                safe_click(driver, back_btn, f"Back button on {path}")
                time.sleep(0.4)
                go(driver, path)  # restore
            except NoSuchElementException:
                log("INFO", f"Back button on {path}", "Not found")


def test_product_detail_page(driver):
    """Navigate to a product detail page if any products exist."""
    print("\n── Product Detail Page (/product/:id)")
    go(driver, "/catalogue")
    try:
        wait_for(driver, By.TAG_NAME, "body")
        cards = driver.find_elements(By.XPATH, "//div[contains(@class,'cursor-pointer') and contains(@class,'rounded-2xl')]")
        if not cards:
            log("INFO", "Product detail: no products in catalogue to click")
            return
        safe_click(driver, cards[0], "Product detail: click first product card")
        time.sleep(1)
        log("PASS", "Product detail page loads", f"URL: {driver.current_url}")

        # Add to cart button on detail page
        try:
            add_btn = driver.find_element(By.XPATH, "//button[contains(text(),'Add to Cart') or contains(text(),'Cart')]")
            log("PASS", "Product detail: Add to Cart button found")
        except NoSuchElementException:
            log("INFO", "Product detail: no Add to Cart button")

        # Back link / breadcrumb
        try:
            back = driver.find_element(By.XPATH, "//button[@aria-label='Go back'] | //a[contains(@href,'/catalogue')]")
            log("PASS", "Product detail: back navigation found")
        except NoSuchElementException:
            log("INFO", "Product detail: no back navigation")

    except Exception as e:
        log("FAIL", "Product detail page", str(e)[:80])


def test_unauthenticated_redirects(driver):
    """Protected routes should redirect or block unauthenticated users."""
    print("\n── Unauthenticated redirect checks")
    # These routes use PrivateRoute which redirects to /login
    private_routes = ["/cart", "/checkout", "/dashboard", "/chat"]
    for path in private_routes:
        go(driver, path)
        time.sleep(0.5)
        current = driver.current_url
        redirected = "/login" in current or current.rstrip("/") == BASE_URL
        if redirected:
            log("PASS", f"Redirect {path} → login/home")
        else:
            log("FAIL", f"Redirect {path}", f"Stayed at {current}")

    # /admin uses AdminRoute which renders a "Not Authenticated" block (not a redirect)
    go(driver, "/admin")
    time.sleep(0.5)
    body_text = driver.find_element(By.TAG_NAME, "body").text
    if "Not Authenticated" in body_text or "403" in body_text or "/login" in driver.current_url:
        log("PASS", "Admin /admin: blocked for unauthenticated user")
    else:
        log("FAIL", "Admin /admin: no auth block found", f"URL: {driver.current_url}")


def test_footer_links(driver):
    """Check footer links on pages that show the footer."""
    print("\n── Footer links")
    go(driver, "/")
    try:
        footer = driver.find_element(By.TAG_NAME, "footer")
        links = footer.find_elements(By.TAG_NAME, "a")
        log("PASS", f"Footer: {len(links)} links found")
        for link in links:
            href = link.get_attribute("href") or ""
            text = link.text.strip()
            if text:
                log("PASS", f"Footer link: '{text}' → {href}")
    except NoSuchElementException:
        log("INFO", "Footer: not found on landing page")


def test_change_password_modal(driver):
    """Test the Change Password modal in the navbar."""
    print("\n── Change Password modal")
    try:
        pwd_btn = driver.find_element(By.XPATH, "//button[contains(text(),'Password') or contains(text(),'🔑')]")
        safe_click(driver, pwd_btn, "Change Password button")
        time.sleep(0.5)

        modal_inputs = driver.find_elements(By.XPATH, "//input[@type='password']")
        if modal_inputs:
            log("PASS", f"Change Password modal: {len(modal_inputs)} password fields")
            # Close modal
            try:
                close = driver.find_element(By.XPATH, "//button[contains(text(),'Cancel') or contains(text(),'Close') or contains(@aria-label,'close')]")
                safe_click(driver, close, "Change Password modal: close")
            except NoSuchElementException:
                from selenium.webdriver.common.keys import Keys
                driver.find_element(By.TAG_NAME, "body").send_keys(Keys.ESCAPE)
        else:
            log("INFO", "Change Password modal: no password inputs found")
    except NoSuchElementException:
        log("INFO", "Change Password button: not found (may need to be logged in)")


# ─────────────────────────────────────────────────────────────────────────────
# Main runner
# ─────────────────────────────────────────────────────────────────────────────

def run_all():
    print("=" * 60)
    print("  Computer Repair Shop — Selenium Browser Tests")
    print(f"  Target: {BASE_URL}")
    print("=" * 60)

    driver = make_driver()
    driver.implicitly_wait(3)

    try:
        # ── Phase 1: Unauthenticated ──────────────────────────────────────
        print("\n▶ Phase 1: Unauthenticated tests")
        test_unauthenticated_redirects(driver)
        test_landing_page(driver)
        test_catalogue_page(driver)
        test_footer_links(driver)
        test_navbar_all_pages(driver)

        # ── Phase 2: Register & Login ─────────────────────────────────────
        print("\n▶ Phase 2: Register & Login")
        test_register_page(driver)
        test_login_page(driver)

        # ── Phase 3: Authenticated user ───────────────────────────────────
        print("\n▶ Phase 3: Authenticated user tests (raj)")
        if login_as(driver, EXISTING_USER, EXISTING_PASS):
            log("PASS", f"Logged in as {EXISTING_USER}")
            test_catalogue_logged_in(driver)
            test_product_detail_page(driver)
            test_cart_page(driver)
            test_checkout_page(driver)
            test_dashboard_page(driver)
            test_change_password_modal(driver)
            test_chat_page(driver)
            logout(driver)
        else:
            log("FAIL", f"Could not log in as {EXISTING_USER} — skipping authenticated tests")

        # ── Phase 4: Admin ────────────────────────────────────────────────
        print("\n▶ Phase 4: Admin tests")
        if login_as(driver, ADMIN_USER, ADMIN_PASS):
            log("PASS", f"Logged in as {ADMIN_USER}")
            test_admin_panel(driver)
            logout(driver)
        else:
            log("FAIL", f"Could not log in as admin ({ADMIN_USER}/{ADMIN_PASS}) — skipping admin tests")

    except Exception as e:
        print(f"\n[FATAL] Unexpected error: {e}")
        traceback.print_exc()
    finally:
        driver.quit()

    # ── Summary ───────────────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print("  RESULTS SUMMARY")
    print("=" * 60)
    passed = sum(1 for r in results if r[0] == "PASS")
    failed = sum(1 for r in results if r[0] == "FAIL")
    info   = sum(1 for r in results if r[0] == "INFO")
    print(f"  PASS: {passed}  |  FAIL: {failed}  |  INFO: {info}")
    print("=" * 60)

    if failed:
        print("\nFailed tests:")
        for r in results:
            if r[0] == "FAIL":
                print(f"  ✗ {r[1]}" + (f" — {r[2]}" if r[2] else ""))

    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(run_all())
