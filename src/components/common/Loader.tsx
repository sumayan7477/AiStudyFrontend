interface LoaderProps {
  size?: "sm" | "md" | "lg";
}

const Loader = ({ size = "md" }: LoaderProps) => {
  const sizes = {
    sm: "w-5 h-5",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div className="flex justify-center items-center py-4">
      <div
        className={`${sizes[size]} animate-spin rounded-full border-4 border-blue-600 border-t-transparent`}
      />
    </div>
  );
};

export default Loader;