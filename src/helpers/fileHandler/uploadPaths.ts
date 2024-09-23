export const getPath = (originalUrl) => {
  const path = "boilerplate/uploads/";
  const pathPartials: any = [
    [/v1\/user\/update/, "img-user-profile-images"],
    [/v1\/blog\/add/, "img-blog-featured-image"],
    [/v1\/blog\/update/, "img-blog-featured-image"],
  ];
  if (!pathPartials.find((p: any) => p[0].test(originalUrl))) {
    console.error(
      "Unable to find a matching path for image, please check regex",
    );
  } else {
    return `${path}${pathPartials.find((p: any) => p[0].test(originalUrl))[1]}/`;
  }
};
