const Listing = require("../models/listing.js");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

module.exports.index = async (req, res) => {
    try {
        const allListings = await Listing.find({});
        res.render("./listings/index.ejs", { allListings });
    } catch (error) {
        console.error("Error fetching listings:", error);
        req.flash("error", "Failed to fetch listings");
        res.redirect("/listings");
    }
};

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
    try {
        const { id } = req.params;
        const listing = await Listing.findById(id)
            .populate({
                path: "reviews",
                populate: {
                    path: "author",
                },
            }).populate("owner");
        if (!listing) {
            req.flash("error", "Cannot find that listing!");
            return res.redirect("/listings");
        }
        res.render("listings/show.ejs", { listing });
    } catch (error) {
        console.error("Error fetching listing:", error);
        req.flash("error", "Failed to fetch the listing");
        res.redirect("/listings");
    }
};

module.exports.createListing = async (req, res, next) => {
    try {
        const response = await geocodingClient.forwardGeocode({
            query: req.body.listing.location,
            limit: 1,
        }).send();

        const { path } = req.file;
        const { filename } = req.file;
        const newListing = new Listing(req.body.listing);
        newListing.owner = req.user._id;
        newListing.image = { url: path, filename };
        newListing.geometry = response.body.features[0].geometry;
        await newListing.save();
        req.flash("success", "New Listing Created!");
        res.redirect("/listings");
    } catch (error) {
        console.error("Error creating listing:", error);
        req.flash("error", "Failed to create a new listing");
        res.redirect("/listings");
    }
};

module.exports.renderEditForm = async (req, res) => {
    try {
        const { id } = req.params;
        const listing = await Listing.findById(id);
        if (!listing) {
            req.flash("error", "Cannot find that listing!");
            return res.redirect("/listings");
        }
        let originalImageUrl = listing.image.url.replace("/upload", "/upload/h_300,w_250");
        res.render("listings/edit.ejs", { listing, originalImageUrl });
    } catch (error) {
        console.error("Error rendering edit form:", error);
        req.flash("error", "Failed to render the edit form");
        res.redirect("/listings");
    }
};

module.exports.updateListing = async (req, res) => {
    try {
        const { id } = req.params;
        let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

        if (req.file) {
            const { path } = req.file;
            const { filename } = req.file;
            listing.image = { url: path, filename };
            await listing.save();
        }

        req.flash("success", "Listing Updated!");
        res.redirect(`/listings/${id}`);
    } catch (error) {
        console.error("Error updating listing:", error);
        req.flash("error", "Failed to update the listing");
        res.redirect(`/listings/${id}`);
    }
};

module.exports.destroyListing = async (req, res) => {
    try {
        const { id } = req.params;
        await Listing.findByIdAndDelete(id);
        req.flash("success", "Listing Deleted!");
        res.redirect("/listings");
    } catch (error) {
        console.error("Error deleting listing:", error);
        req.flash("error", "Failed to delete the listing");
        res.redirect("/listings");
    }
};
