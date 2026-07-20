export const getServerSideProps = async () => ({
  redirect: {
    destination: "/request-a-quote",
    permanent: false,
  },
});

const PricingRedirect = () => null;

export default PricingRedirect;
