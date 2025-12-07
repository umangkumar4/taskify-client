// import logoImg from '../../assets/logo.png';
import logoImg from '../../assets/logo-removebg-preview.png';



interface LogoProps {
    className?: string;
    textClassName?: string;
}

export const Logo = ({ className = "w-20 h-20", textClassName = "text-2xl" }: LogoProps) => {
    return (
        <div className="flex items-center gap-2">
            <img
                src={logoImg}
                alt="Talkify Logo"
                className={`${className} object-contain`}
            />
            {/* <span className={`font-bold text-gray-800 tracking-tight ${textClassName}`}>
                Talkify
            </span> */}
        </div>
    );
};
