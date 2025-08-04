// .tsx means TypeScript combined with React
// .ts is just TypeScript

import { useState } from "react";
import "./Message.css";
import SubmissionGrid from "./SubmissionGrid";

type WishlistItem = {
  url: string;
  image: string;
};

function InsertLink() {
  const [link, setLink] = useState("");

  const [submissions, setSubmissions] = useState<WishlistItem[]>([
    {
      url: "https://www.apple.com/shop/buy-mac/macbook-pro/14-inch-space-black-standard-display-apple-m4-chip-with-10-core-cpu-and-10-core-gpu-16gb-memory-512gb",
      image:
        "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/mbp14-spaceblack-cto-hero-202410?wid=1200&hei=630&fmt=jpeg&qlt=95&.v=1731525368099",
    },
    {
      url: "https://www.buckmason.com/products/dried-wheatgrass-draped-twill-ss-one-pocket-shirt-1",
      image:
        "http://cdn.shopify.com/s/files/1/0123/5065/2473/files/BM13367.137_DRAPED-TWILL-SS-ONE-POCKET-SHIRT_M-OLIVE.jpg?v=1741972366&width=1024&height=1024",
    },
    {
      url: "https://www.amazon.com/Taruzil-Kitchen-Christmas-Birthday-Halloween/dp/B0D92B8DJ6/ref=sr_1_4_sspa?crid=1WHP7S10KCWOO&dib=eyJ2IjoiMSJ9.BYhTlOUrAlaamK8fea3-_548HXPjqXTvHs5XOjW-XXyeyeRXHZGF4Gtz_SRndpgndF9VEknypd6pXtCcZlwekCdVZUHnIKGLMMkMo0XOQArI0nwfTEdD1oy7C3aHsq3nLoQKYmbeXyfoEPvvR9jdvfkzNuN1enObuYNdjWlRZNmZlYC-_JFBgJ0OREqjDC2cmwKs4h3hGysMNCJJZnHdUiUq2v-rysy4NuMJm5u8uWVBtnGkZzGHzgmfb_XiL2FzOCuGl84Unlw6u0pAbVJEykT5a-ZP7wX4LBhedgrAQA0.tj0Tn5K93GCqW4cM5YqkZE9kE4ktjxj31w_bugBq1Fc&dib_tag=se&keywords=matcha+set&qid=1754278683&sprefix=matcha+%2Caps%2C369&sr=8-4-spons&sp_csd=d2lkZ2V0TmFtZT1zcF9hdGY&psc=1",
      image:
        "https://m.media-amazon.com/images/I/41WBS5+tk0L.jpg_BO30,255,255,255_UF900,850_SR1910,1000,0,C_PIRIOFOURANDHALF-medium,BottomLeft,30,-20_ZA345,500,900,420,420,AmazonEmber,50,4,0,0_QL100_.jpg",
    },
  ]);
  const [showCart, setShowCart] = useState(false);
  const [isCartHovered, setIsCartHovered] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleMouseEnter = () => setIsCartHovered(true);
  const handleMouseLeave = () => setIsCartHovered(false);

  const handleCart = () => {
    setShowCart((prev) => !prev); // toggle the popup
  };

  // Takes in what user is submitting and tracks
  const handleSend = async (url: string) => {
    if (!url.trim()) return;

    try {
      const response = await fetch("http://localhost:5001/preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: encodeURI(url) }),
      });

      const data = await response.json();

      if (data.image) {
        setSubmissions((prev) => [...prev, { url, image: data.image }]);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
      } else {
        console.warn("No image found for this URL");
      }
    } catch (err) {
      console.error("Failed to fetch image preview", err);
    }

    setLink("");
  };
  const handleDelete = (index: number) => {
    setSubmissions((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="whole-container">
      {showToast && <div className="cart-toast">Added to Cart!</div>}
      <div
        className="cart-container"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="cart-btn">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 24 24"
            className="w-6 h-6"
          >
            <path d="M7 18c-1.104 0-2 .896-2 2s.896 2 2 2 2-.896 2-2-.896-2-2-2zm10 0c-1.104 0-2 .896-2 2s.896 2 2 2 2-.896 2-2-.896-2-2-2zM7.333 4l-.94-2H1v2h3l3.6 7.59-1.35 2.44C5.11 15.37 6.48 17 8.25 17H19v-2H8.42c-.14 0-.25-.11-.25-.25l.03-.12L9.1 13h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0021 4H7.333z" />
          </svg>
        </div>

        {isCartHovered && (
          <div className="cart-popup">
            <h2>My Cart</h2>
            <p className="Total-Items">Total Items: {submissions.length}</p>
            {submissions.length === 0 ? (
              <p>Your cart is empty.</p>
            ) : (
              <ul>
                {submissions.map((item, index) => (
                  <li key={index}>
                    <img src={item.image} alt="Item" width="50" />
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="link-container">
        <title className="browser-link">Shopping List</title>
        <h1 className="introduction">Welcome Back, Meiqi!</h1>
        <img
          className="background-banner"
          src="background.avif"
          alt="Decorative banner"
        />
        <div className="link-container top">
          <input
            className="link-input"
            placeholder="Insert your Wishlist Link!"
            /* input reflects the state */
            value={link}
            /* updates state when user types */
            onChange={(e) => setLink(e.target.value)}
          />
          <button className="send-button" onClick={() => handleSend(link)}>
            SEND
          </button>
        </div>
        <div className=" link-container bottom">
          <SubmissionGrid
            submissions={submissions}
            handleDelete={handleDelete}
          />
        </div>
      </div>
    </div>
  );
}

export default InsertLink;
